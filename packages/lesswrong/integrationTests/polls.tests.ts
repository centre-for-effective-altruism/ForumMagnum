import "./integrationTestSetup";
import { createDummyComment, createDummyPost, createDummyUser } from "./utils";
import { randomId } from "../lib/random";
import { ForumEvents } from "../server/collections/forumEvents/collection";
import { Comments } from "../server/collections/comments/collection";
import { updateComment } from "../server/collections/comments/mutations";
import { computeContextFromUser } from "../server/vulcan-lib/apollo-server/context";

const pollMarkup = (internalId: string, days = 3) =>
  `<div class="ck-poll" data-internal-id="${internalId}" data-props='${JSON.stringify({
    question: "Is this a test?",
    agreeWording: "Yes",
    disagreeWording: "No",
    duration: { days, hours: 0, minutes: 0 },
    colorScheme: {
      lightColor: "#ffffff",
      darkColor: "#000000",
      bannerTextColor: "#ffffff",
    },
  })}'></div>`;

const ckEditorContents = (data: string) => ({
  originalContents: { type: "ckEditorMarkup", data },
});

const createPollComment = async (user: DbUser, postId: string, html: string) =>
  createDummyComment(user, { postId, contents: ckEditorContents(html) });

const getInternalIds = (html: string) =>
  [...html.matchAll(/data-internal-id="([^"]+)"/g)].map(([, id]) => id);

describe("Polls in comments", () => {
  it("creates a new poll when a poll is pasted from another comment", async () => {
    const user = await createDummyUser();
    const post = await createDummyPost(user);
    const pollId = randomId();
    const original = await createPollComment(user, post._id, `<p>Poll</p>${pollMarkup(pollId)}`);
    const pasted = await createPollComment(user, post._id, `<p>Poll</p>${pollMarkup(pollId)}`);

    const originalPoll = await ForumEvents.findOne({ _id: pollId });
    expect(originalPoll?.commentId).toBe(original._id);

    const pastedComment = await Comments.findOne({ _id: pasted._id });
    const [pastedPollId] = getInternalIds(pastedComment!.contents!.html!);
    expect(pastedPollId).not.toBe(pollId);
    const pastedPoll = await ForumEvents.findOne({ _id: pastedPollId });
    expect(pastedPoll?.commentId).toBe(pasted._id);
  });

  it("keeps a comment's own poll when the comment is edited", async () => {
    const user = await createDummyUser();
    const post = await createDummyPost(user);
    const pollId = randomId();
    const comment = await createPollComment(user, post._id, `<p>Poll</p>${pollMarkup(pollId)}`);
    const context = await computeContextFromUser({ user, isSSR: false });
    await updateComment({
      selector: { _id: comment._id },
      data: { contents: ckEditorContents(`<p>Edited</p>${pollMarkup(pollId)}`) },
    }, context);

    const updatedComment = await Comments.findOne({ _id: comment._id });
    expect(getInternalIds(updatedComment!.contents!.html!)).toEqual([pollId]);
    const polls = await ForumEvents.find({ commentId: comment._id }).fetch();
    expect(polls.map(({ _id }) => _id)).toEqual([pollId]);
  });

  it("reuses the same new poll when a pasted poll is saved repeatedly", async () => {
    const user = await createDummyUser();
    const post = await createDummyPost(user);
    const pollId = randomId();
    await createPollComment(user, post._id, `<p>Poll</p>${pollMarkup(pollId)}`);
    const comment = await createPollComment(user, post._id, "<p>No poll yet</p>");
    for (const text of ["First save", "Second save"]) {
      // Each save is a separate request, with its own loader cache
      const context = await computeContextFromUser({ user, isSSR: false });
      await updateComment({
        selector: { _id: comment._id },
        data: { contents: ckEditorContents(`<p>${text}</p>${pollMarkup(pollId)}`) },
      }, context);
    }

    const polls = await ForumEvents.find({ commentId: comment._id }).fetch();
    expect(polls).toHaveLength(1);
    expect(polls[0]._id).not.toBe(pollId);
  });

  it("creates a new poll when a poll is duplicated within a comment", async () => {
    const user = await createDummyUser();
    const post = await createDummyPost(user);
    const pollId = randomId();
    const comment = await createPollComment(
      user,
      post._id,
      `<p>Polls</p>${pollMarkup(pollId)}${pollMarkup(pollId)}`,
    );

    const savedComment = await Comments.findOne({ _id: comment._id });
    const internalIds = getInternalIds(savedComment!.contents!.html!);
    expect(new Set(internalIds).size).toBe(2);
    const polls = await ForumEvents.find({ commentId: comment._id }).fetch();
    expect(polls.map(({ _id }) => _id).sort()).toEqual([...internalIds].sort());
  });
});

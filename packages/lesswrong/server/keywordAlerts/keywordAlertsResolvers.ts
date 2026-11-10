import gql from 'graphql-tag';
import { hasKeywordAlerts } from "@/lib/betas";
import { accessFilterMultiple } from "@/lib/utils/schemaUtils";
import { createPaginatedResolver } from "../resolvers/paginatedResolver";
import { fetchContentForKeyword } from "./keywordSearch";

const keywordAlertTypeDef = gql`
  type KeywordAlert {
    _id: String!
    post: Post
    comment: Comment
  }
`;

type VisibleKeywordAlert = {
  _id: string,
  post: Partial<DbPost>,
  comment?: never,
} | {
  _id: string,
  post?: never,
  comment: Partial<DbComment>,
};

const { Query, typeDefs } = createPaginatedResolver({
  name: "KeywordAlerts",
  graphQLType: "KeywordAlert",
  args: {
    keyword: "String!",
    startDate: "Date!",
    endDate: "Date!",
  },
  callback: async (context, limit, args) => {
    if (!hasKeywordAlerts) {
      throw new Error("Keyword alerts not enabled");
    }

    if (!args) {
      throw new Error("Missing args");
    }

    const {keyword, startDate, endDate} = args;
    if (!keyword || typeof keyword !== "string") {
      throw new Error("Invalid keyword");
    }
    if (!(startDate instanceof Date)) {
      throw new Error("Invalid startDate");
    }
    if (!(endDate instanceof Date)) {
      throw new Error("Invalid endDate");
    }

    const results = await fetchContentForKeyword(context, keyword, startDate, endDate, limit);
    const [posts, comments] = await Promise.all([
      accessFilterMultiple(
        context.currentUser,
        "Posts",
        results.flatMap(({post}) => post ? [post] : []),
        context,
      ),
      accessFilterMultiple(
        context.currentUser,
        "Comments",
        results.flatMap(({comment}) => comment ? [comment] : []),
        context,
      ),
    ]);
    const visiblePosts = new Map(posts.map((post) => [post._id, post]));
    const visibleComments = new Map(comments.map((comment) => [comment._id, comment]));
    return results.flatMap<VisibleKeywordAlert>(({_id, post}) => {
      if (post) {
        const visiblePost = visiblePosts.get(_id);
        return visiblePost ? [{_id, post: visiblePost}] : [];
      }
      const visibleComment = visibleComments.get(_id);
      return visibleComment ? [{_id, comment: visibleComment}] : [];
    });
  },
});

export const keywordAlertsQueryHandlers = Query;

export const keywordAlertsTypeDefs = gql`
  ${keywordAlertTypeDef}
  ${typeDefs}
`;

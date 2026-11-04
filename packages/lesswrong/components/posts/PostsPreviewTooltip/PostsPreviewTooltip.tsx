import React, { FC } from "react";
import EAPostsPreviewTooltip from "./EAPostsPreviewTooltip";

export interface DialogueMessageInfo {
  dialogueMessageId: string
  dialogueMessageContents: string
}

export type PostsPreviewTooltipProps = {
  postsList?: boolean,
  hash?: string|null,
  post: PostsList|SunshinePostsList|null,
  comment?: CommentsList,
  dialogueMessageInfo?: DialogueMessageInfo,
}

export const PostsPreviewTooltip: FC<PostsPreviewTooltipProps> = (props) =>
  <EAPostsPreviewTooltip {...props} />;

import React, { useContext, useRef } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { nofollowKarmaThreshold } from '../../../lib/publicSettings';
import { useSingle } from '../../../lib/crud/withSingle';
import mapValues from 'lodash/mapValues';
import { SideItemVisibilityContext } from '../../dropdowns/posts/SetSideItemVisibility';
import { type ContentItemBodyImperative } from '../../contents/contentBodyUtil';
import { ContentItemBody } from '@/components/contents/ContentItemBody';
import { hasSideComments } from '../../../lib/betas';
import { VotingProps } from '@/components/votes/votingProps';
import { SideCommentIcon } from "../../comments/SideCommentIcon";

const PostBody = ({post, html, isOldVersion, voteProps}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  html: string,
  isOldVersion: boolean
  voteProps: VotingProps<PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes>
}) => {

  const sideItemVisibilityContext = useContext(SideItemVisibilityContext);
  const sideCommentMode= isOldVersion ? "hidden" : (sideItemVisibilityContext?.sideCommentMode ?? "hidden")
  const includeSideComments =
    hasSideComments &&
    sideCommentMode &&
    sideCommentMode !== "hidden";

  const { document } = useSingle({
    documentId: post._id,
    collectionName: "Posts",
    fragmentName: 'PostSideComments',
    skip: !includeSideComments,
  });
  
  const nofollow = (post.user?.karma || 0) < nofollowKarmaThreshold.get();
  const contentRef = useRef<ContentItemBodyImperative|null>(null);
  let content: React.ReactNode
  
    
  if (includeSideComments && document?.sideComments) {
    const htmlWithIDs = document.sideComments.html;
    const sideComments = sideCommentMode==="highKarma"
      ? document.sideComments.highKarmaCommentsByBlock
      : document.sideComments.commentsByBlock;
    const sideCommentsMap = mapValues(sideComments, commentIds => <SideCommentIcon post={post} commentIds={commentIds}/>)

    content = <ContentItemBody
      dangerouslySetInnerHTML={{__html: htmlWithIDs}}
      ref={contentRef}
      key={`${post._id}_${sideCommentMode}`}
      description={`post ${post._id}`}
      nofollow={nofollow}
      idInsertions={sideCommentsMap}
    />
  } else {
    content = <ContentItemBody
      dangerouslySetInnerHTML={{__html: html}}
      ref={contentRef}
      description={`post ${post._id}`}
      nofollow={nofollow}
    />
  }
  
  return content;
}

export default registerComponent('PostBody', PostBody);



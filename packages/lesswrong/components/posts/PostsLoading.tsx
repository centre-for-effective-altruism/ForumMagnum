import range from 'lodash/range';
import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import type { PostsListViewType } from '../hooks/usePostsListView';
import Loading from "../vulcan-core/Loading";
import FriendlyPlaceholderPostsItem from "./FriendlyPlaceholderPostsItem";

const PostsLoading = ({
  placeholderCount,
  showFinalBottomBorder,
  viewType = "list",
}: {
  placeholderCount?: number,
  showFinalBottomBorder?: boolean
  viewType?: PostsListViewType,
}) => {
  if (!placeholderCount) {
    return <Loading />;
  }

  return <>
    {range(0, placeholderCount)
      .map(i => <FriendlyPlaceholderPostsItem
        key={i}
        viewType={viewType}
      />)}
  </>
};

export default registerComponent('PostsLoading', PostsLoading);



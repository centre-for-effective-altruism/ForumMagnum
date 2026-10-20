import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';
import Loading from "../vulcan-core/Loading";
import PostsItem from "./PostsItem";
import LoadMore from "../common/LoadMore";
import SectionFooter from "../common/SectionFooter";

export const ResolverPostsList = ({resolverName, skip, limit=13, showLoadMore=false, fallbackText}: {
  resolverName: string,
  skip?: boolean,
  limit?: number,
  showLoadMore?: boolean,
  fallbackText?: string
}) => {
  const { results, loading, loadMoreProps } = usePaginatedResolver({
    resolverName, 
    fragmentName: "PostsListWithVotes",
    limit,
    skip
  });

  if (loading && !results) {
    return <Loading/>
  }

  if (!results) {
    return <div>{fallbackText}</div>;
  }

  return <div>
    {results.map((post) => <PostsItem key={post._id} post={post} />)}
    {showLoadMore && <SectionFooter>
      <LoadMore
        {...loadMoreProps}
        sectionFooterStyles
      />
    </SectionFooter>}
  </div>

}

export default registerComponent('ResolverPostsList', ResolverPostsList);

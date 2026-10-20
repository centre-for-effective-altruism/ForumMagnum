import React, { useState } from 'react';
import { NetworkStatus, gql, useQuery } from '@apollo/client';
import { isServer } from '../../lib/executionEnvironment';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { fragmentTextForQuery } from "../../lib/vulcan-lib/fragments";
import LoadMore from "../common/LoadMore";
import PostsItem from "./PostsItem";
import SectionFooter from "../common/SectionFooter";
import PostsLoading from "./PostsLoading";

// Would be nice not to duplicate in postResolvers.ts but unfortunately the post types are different
interface VertexRecommendedPost {
  post: PostsListWithVotes,
  attributionId?: string,
}

const DEFAULT_RESOLVER_NAME = 'GoogleVertexPosts';

type VertexResolver = typeof DEFAULT_RESOLVER_NAME;

const getVertexPostsQuery = (resolverName: VertexResolver) => gql`
  query get${resolverName}($limit: Int) {
    ${resolverName}(limit: $limit) {
      results {
        post {
          ...PostsListWithVotes
        }
        attributionId
      }
    }
  }
  ${fragmentTextForQuery('PostsListWithVotes')}
`;

export const stickiedPostTerms: PostsViewTerms = {
  view: 'stickied',
  limit: 4, // seriously, shouldn't have more than 4 stickied posts
  forum: true
};

export const VertexPostsList = ({ limit = 100 }: {
  limit?: number,
}) => {
  const [displayCount, setDisplayCount] = useState(15);

  const resolverName = DEFAULT_RESOLVER_NAME;

  const query = getVertexPostsQuery(resolverName);
  const { data, loading, networkStatus } = useQuery(query, {
    ssr: false || !isServer,
    notifyOnNetworkStatusChange: true,
    pollInterval: 0,
    variables: {
      limit,
    },
  });

  const results: VertexRecommendedPost[] | undefined = data?.[resolverName]?.results;

  if (loading && !results) {
    return <PostsLoading placeholderCount={limit} />;
  }

  if (!results) {
    return null;
  }

  return <div>
    <div>
      {results.slice(0, displayCount).map(({ post, attributionId }) => <PostsItem 
        key={post._id} 
        post={post} 
        vertexAttributionId={attributionId} 
      />)}
    </div>
    <SectionFooter>
      <LoadMore
        loading={loading || networkStatus === NetworkStatus.fetchMore}
        loadMore={() => {
          // Purely for admin testing, see e.g. RecombeePostsList for a custom loadMore implementation if we figure one out for Vertex
          if (displayCount < 100) {
            setDisplayCount(Math.min(100, displayCount + 15));
          }
        }}
        sectionFooterStyles
      />
    </SectionFooter>
  </div>;
}

export default registerComponent('VertexPostsList', VertexPostsList);

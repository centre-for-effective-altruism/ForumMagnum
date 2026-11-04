import React, { useContext } from 'react';
import { useCurrentUser } from '../../common/withUser';
import { useTracking } from '../../../lib/analyticsEvents';
import { IsRecommendationContext } from './PostActions';
import withErrorBoundary from '../../common/withErrorBoundary';
import { useDialog } from '../../common/withDialog';
import { useSetIsHiddenMutation } from './useSetIsHidden';
import { registerComponent } from "../../../lib/vulcan-lib/components";
import LoginPopup from "../../users/LoginPopup";
import DropdownItem from "../DropdownItem";

const styles = (theme: ThemeType) => ({
  icon: {
    cursor: "pointer",
    color: theme.palette.icon.dim3,
  },
});

const DislikeRecommendationDropdownItem = ({post}: {post: PostsBase}) => {
  const isRecommendation = useContext(IsRecommendationContext)
  const currentUser = useCurrentUser();
  const {openDialog} = useDialog()
  const {captureEvent} = useTracking();

  const { setIsHiddenMutation } = useSetIsHiddenMutation();

  // We do not show post hiding from frontpage and 'dislike recommendation' as the latter includes the former. See DislikeRecommendationDropdownItem.tsx
  if (!isRecommendation) {
    return null;
  }

  const dislikeRecommendation = () => {
    if (!currentUser) {
      openDialog({
        name: "LoginPopup",
        contents: ({onClose}) => <LoginPopup onClose={onClose} />
      });
      return;
    }

    void setIsHiddenMutation({postId: post._id, isHidden: true})
    captureEvent("recommendationNotInterestedClicked", {postId: post._id, pageSubElementContext: "tripleDot"})
  }

  const title = 'Dismiss recommendation'
  const icon = 'NotInterested'
  return (
    <DropdownItem
      title={title}
      onClick={dislikeRecommendation}
      icon={icon}
    />
  );
}

export default registerComponent(
  'DislikeRecommendationDropdownItem',
  DislikeRecommendationDropdownItem,
  {
    styles,
    hocs: [withErrorBoundary],
  },
);



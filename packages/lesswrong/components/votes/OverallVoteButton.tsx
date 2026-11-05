import React from 'react';

import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import { useTracking } from '../../lib/analyticsEvents';
import LoginPopup from "../users/LoginPopup";
import VoteButton from "./VoteButton";
import VoteArrowIcon from "./VoteArrowIcon";

export interface OverallVoteButtonProps<T extends VoteableTypeClient> {
  vote?: (props: {
    document: T,
    voteType: string|null,
    extendedVote?: any,
    currentUser: UsersCurrent,
  }) => void,
  collectionName: CollectionNameString,
  document: T,
  upOrDown: "Upvote"|"Downvote",
  color: "error"|"primary"|"secondary",
  orientation: "up"|"down"|"left"|"right",
  enabled: boolean,
  solidArrow?: boolean,
  largeArrow?: boolean
}

const OverallVoteButton = <T extends VoteableTypeClient>({
  vote, collectionName, document, upOrDown,
  color = "secondary",
  orientation = "up",
  enabled,
  solidArrow,
  largeArrow,
}: OverallVoteButtonProps<T>) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { captureEvent } = useTracking();

  const wrappedVote = (strength: "big"|"small"|"neutral") => {
    const voteType = strength === 'neutral' ? 'neutral' : strength+upOrDown;
    
    if(!currentUser){
      openDialog({
        name: "LoginPopup",
        contents: ({onClose}) => <LoginPopup onClose={onClose}/>
      });
    } else {
      vote?.({document, voteType: voteType, extendedVote: document?.currentUserExtendedVote, currentUser});
      captureEvent("vote", {collectionName});
    }
  }

  return <VoteButton
    VoteIconComponent={VoteArrowIcon}
    vote={wrappedVote}
    currentStrength={
      (document.currentUserVote === "big"+upOrDown)
        ? "big"
        : (
        (document.currentUserVote === "small"+upOrDown)
          ? "small"
          : "neutral"
      )
    }
    upOrDown={upOrDown}
    color={color}
    orientation={orientation}
    solidArrow={solidArrow}
    largeArrow={largeArrow}
    enabled={enabled}
  />
}

export default registerComponent('OverallVoteButton', OverallVoteButton);



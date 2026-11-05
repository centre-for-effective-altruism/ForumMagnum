export type EmojiReactName = string;
export type VoteOnReactionType = "created"|"seconded"|"disagreed";
export type QuoteLocator = string;

export type UserVoteOnSingleReaction = {
  react: EmojiReactName
  vote: VoteOnReactionType

  //HACK: This isn't really an array. When writing to the DB, this array can
  //have at most one element. When reading from the DB, results must pass
  //through a normalization function that ensures this isn't a multi-element array.
  quotes?: QuoteLocator[]
};
export type NamesAttachedReactionsVote = {
  agreement?: string,
  reacts?: UserVoteOnSingleReaction[]
}

export type UserReactInfo = {
  userId: string
  reactType: VoteOnReactionType
  displayName: string
  karma: number

  //HACK: This isn't really an array. When writing to the DB, this array can
  //have at most one element. When reading from the DB, results must pass
  //through a normalization function that ensures this isn't a multi-element array.
  quotes?: QuoteLocator[]
}
export type NamesAttachedReactionsList = {
  [reactionType: EmojiReactName]: UserReactInfo[]|undefined
};

export type NamesAttachedReactionsScore = {
  approvalVoteCount: number,
  agreement: number,
  agreementVoteCount: number,
  reacts: NamesAttachedReactionsList,
};



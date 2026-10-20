import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { useCallback } from 'react';
import { useTracking } from "../../lib/analyticsEvents";

const AnalyticsTracker = ({eventType, eventProps, children, captureOnClick=true, skip}: {
  eventType: string,
  eventProps?: Record<string,any>,
  children?: React.ReactNode,
  captureOnClick?: boolean,
  skip?: boolean,
}) => {
  const { captureEvent } = useTracking({eventType, eventProps})
  const handleClick = useCallback((e: React.MouseEvent) => {
    !skip && captureOnClick && captureEvent(`${eventType}Clicked`,
        {...eventProps, buttonPressed: e.button})
  }, [eventProps, captureEvent, skip, captureOnClick, eventType])

  return (
    <span onMouseDown={handleClick}>
      { children }
    </span>
  )
};

export default registerComponent('AnalyticsTracker', AnalyticsTracker);



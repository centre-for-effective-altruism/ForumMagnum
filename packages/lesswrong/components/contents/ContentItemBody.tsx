import React, { useEffect, useImperativeHandle, useMemo, useRef, type CSSProperties } from 'react';
import { addNofollowToHTML, type ContentItemBodyProps } from './contentBodyUtil';
import * as htmlparser2 from "htmlparser2";
import { type ChildNode as DomHandlerChildNode } from 'domhandler';
import pick from 'lodash/pick';
import { MaybeScrollableBlock } from './HorizScrollBlock';
import HoverPreviewLink from '../linkPreview/HoverPreviewLink';
import { ConditionalVisibilitySettings } from '../editor/conditionalVisibilityBlock/conditionalVisibility';
import ConditionalVisibilityBlockDisplay from '../editor/conditionalVisibilityBlock/ConditionalVisibilityBlockDisplay';
import ElicitBlock from './ElicitBlock';
import { hasCollapsedFootnotes } from '@/lib/betas';
import { CollapsedFootnotes } from './CollapsedFootnotes';
import { WrappedStrawPoll } from './WrappedStrawPoll';
import { validateUrl } from '@/lib/vulcan-lib/utils';
import { captureEvent } from '@/lib/analyticsEvents';
import ForumEventPostPagePollSection from '../forumEvents/ForumEventPostPagePollSection';
import { captureException } from '@sentry/core';

type PassedThroughContentItemBodyProps = Pick<ContentItemBodyProps, "description"|"noHoverPreviewPrefetch"|"nofollow"|"contentStyleType"|"idInsertions"> & {
  bodyRef: React.RefObject<HTMLDivElement|null>
}

/**
 * Renders user-generated HTML, with progressive enhancements. Replaces
 * ContentItemBody, by parsing and recursing through an HTML parse tree rather
 * than doing post-mount modifications.
 *
 * Functionality from the old ContentItemBody which is supported:
 *   markHoverableLinks
 *   markScrollableBlocks
 *   applyIdInsertions
 *   markConditionallyVisibleBlocks
 *   markElicitBlocks
 *   collapseFootnotes
 *   wrapStrawPoll
 * Functionality from the old ContentItemBody which is implemented, but not well tested:
 *   addCTAButtonEventListeners
 *   replaceForumEventPollPlaceholders
 *   exposeInternalIds
 * Additional limitations:
 *   CDATA, directive, script, and style nodes are ignored. These will be
 *   stripped from user-generated content by the sanitizer but may show up in
 *   admin-generated posts.
 *
 * Not in ContentItemBody, but would be useful to add here: Truncation. Since
 * we're walking a parsed HTML tree, this is a better place for the
 * functionality that's currently handled by `truncatize`.
 */
export const ContentItemBody = (props: ContentItemBodyProps) => {
  const { onContentReady, nofollow, dangerouslySetInnerHTML, className, ref } = props;
  const bodyRef = useRef<HTMLDivElement|null>(null);
  const html = (nofollow
    ? addNofollowToHTML(dangerouslySetInnerHTML.__html)
    : dangerouslySetInnerHTML.__html
  );
  const parsedHtml = useMemo(() => htmlparser2.parseDocument(html), [html]);

  useImperativeHandle(ref, () => ({
    containsNode: (node: Node): boolean => {
      return !!bodyRef.current?.contains(node);
    },
    getText: (): string => {
      return bodyRef.current?.textContent ?? ""
    },
    getAnchorEl: (): HTMLDivElement|null => {
      return bodyRef.current;
    },
  }));
  
  useEffect(() => {
    if (bodyRef.current) {
      onContentReady?.(bodyRef.current);
    }
  }, [onContentReady]);
  
  const passedThroughProps = {
    ...pick(props, ["description", "noHoverPreviewPrefetch", "nofollow", "contentStyleType", "idInsertions"]),
    bodyRef,
  };
  
  return <div className={className} ref={bodyRef}>
    {parsedHtml.childNodes.map((child,i) => <ContentItemBodyInner
      key={i}
      parsedHtml={child}
      passedThroughProps={passedThroughProps}
      root={true}
    />)}
  </div>
}

const ContentItemBodyInner = ({parsedHtml, passedThroughProps, root=false}: {
  parsedHtml: DomHandlerChildNode,
  passedThroughProps: PassedThroughContentItemBodyProps,
  root?: boolean,
}) => {
  switch (parsedHtml.type) {
    case htmlparser2.ElementType.CDATA:
    case htmlparser2.ElementType.Directive:
    case htmlparser2.ElementType.Root:
      return null;

    case htmlparser2.ElementType.Script: {
      // Embedded script tag. This can appear in posts/etc if they were last edited
      // by an admin (otherwise the validator will have stripped it out.)
      const scriptText: string = parsedHtml.childNodes
        .map((c,i) => c.type === htmlparser2.ElementType.Text ? c.data : "")
        .join("");
      return <script>{scriptText}</script>;
    }
    case htmlparser2.ElementType.Style: {
      // Embedded script tag. This can appear in posts/etc if they were last edited
      // by an admin (otherwise the validator will have stripped it out.) All children
      // must be text nodes.
      const styleText: string = parsedHtml.childNodes
        .map((c,i) => c.type === htmlparser2.ElementType.Text ? c.data : "")
        .join("");
      return <style>{styleText}</style>;
    }

    case htmlparser2.ElementType.Tag: {
      let TagName = parsedHtml.tagName.toLowerCase() as any;
      if (TagName === 'html' || TagName === 'body' || TagName === 'head') {
        TagName = 'div';
      }
      const attribs = translateAttribs(parsedHtml.attribs);
      const id = attribs.id;
      const classNames = parsedHtml.attribs.class?.split(' ') ?? [];

      let mappedChildren: React.ReactNode[] = parsedHtml.childNodes.map((c,i) => <ContentItemBodyInner
        key={i}
        parsedHtml={c}
        passedThroughProps={passedThroughProps}
      />)

      if (classNames.includes("footnotes") && hasCollapsedFootnotes) {
        return <CollapsedFootnotes TagName={TagName} attributes={attribs} footnoteElements={mappedChildren}/>
      }

      let result: React.ReactNode|React.ReactNode[] = mappedChildren;
      if (id && passedThroughProps.idInsertions?.[id]) {
        const idInsertion = passedThroughProps.idInsertions[id];
        result = [
          <React.Fragment key="inserted">{idInsertion}</React.Fragment>,
           ...result
        ];
      }
      
      if (classNames.includes("conditionallyVisibleBlock")) {
        const visibilityOptionsStr = attribs["data-visibility"];
        if (visibilityOptionsStr) {
          let visibilityOptions: ConditionalVisibilitySettings|null = null;
          try {
            visibilityOptions = JSON.parse(visibilityOptionsStr)
            result = <ConditionalVisibilityBlockDisplay options={visibilityOptions!}>
              {result}
            </ConditionalVisibilityBlockDisplay>;
          } catch {
            // eslint-disable-next-line no-console
            console.error("Error parsing conditional visibility options", visibilityOptionsStr);
          }
        }
      }
      if (classNames.includes("elicit-binary-prediction")) {
        const elicitId = attribs['data-elicit-id'];
        if (elicitId) {
          result = <ElicitBlock questionId={elicitId}/>
        }
      }
      if (classNames.includes("strawpoll-embed")) {
        result = <WrappedStrawPoll>
          {result}
        </WrappedStrawPoll>
      }
      if (classNames.includes("ck-cta-button")) {
        if (attribs['data-href']) {
          attribs.href = validateUrl(attribs['data-href']);
        }
        const originalOnClick = attribs['onClick'];
        attribs['onClick'] = (ev: React.MouseEvent<HTMLAnchorElement>) => {
          captureEvent("ctaButtonClicked", {href: attribs['data-href']});
          originalOnClick?.(ev);
        }
      }
      if (classNames.includes("ck-poll")) {
        const forumEventId = attribs['data-internal-id'];
        if (forumEventId) {
          return <ForumEventPostPagePollSection id={forumEventId} forumEventId={forumEventId} />
        }
      }
      if (attribs['data-internal-id']) {
        // If the element has a data-internal-id attribute, translate it into `id`. This is used in
        // some ckeditor plugins (Google Docs import, ckeditor5-poll, internal-block-links) to
        // support internal linking.
        // If the element already has an ID, create a wrapper span with the added ID. Otherwise add
        // it to the element.
        // TODO: The previous implementation of this also checked the document for elements with
        // the same ID, which is not implemented here (and is complicated significantly by render
        // timings). I'm not sure whether that's actually important.
        if (attribs.id) {
          result = <span id={attribs['data-internal-id']}>{result}</span>
        } else {
          attribs.id = attribs['data-internal-id'];
        }
      }

      if (root && ['p','div','table'].includes(TagName)) {
        return <MaybeScrollableBlock TagName={TagName} attribs={attribs} bodyRef={passedThroughProps.bodyRef}>
          {result}
        </MaybeScrollableBlock>
      } else if (TagName === 'a') {
        return <HoverPreviewLink
          href={attribs.href}
          {...passedThroughProps}
          {...attribs}
        >
          {result}
        </HoverPreviewLink>
      } else if (parsedHtml.childNodes.length > 0) {
        return <TagName {...attribs}>
          {result}
        </TagName>
      } else {
        return <TagName {...attribs}/>
      }
    }

    case htmlparser2.ElementType.Text:
      return parsedHtml.data;

    case htmlparser2.ElementType.Comment:
      return null;
  }
}

/**
 * Translate an attributes-dict from parsed HTML into something that can be
 * passed to React. In particular, if there's a `style` attribute, it will be
 * a string that needs to be converted into `CSSProperties` (a k-v dict); and,
 * if there's an attribute which React knows by a different name, apply the
 * inverse mapping, ie class->className, srcset->srcSet.
 *
 * This is NOT a sanitization/validation function. The expectation is that the
 * HTML was validated before it was passed to ContentItemBody and parsed.
 */
function translateAttribs(attribs: Record<string,string>): Record<string,any> {
  let attribsCopy: any = {...attribs};
  if ('style' in attribsCopy) {
    attribsCopy.style = parseInlineStyle(attribs.style);
  }

  // These two are used in the custom Bayes Rule Guide html.
  // Using `new Function` seemed safer than `eval`.
  if ('onclick' in attribsCopy) {
    try {
      attribsCopy.onClick = new Function(attribsCopy.onclick);
      delete attribsCopy.onclick;  
    } catch (e) {
      captureException(`Error parsing onclick attribute in ContentItemBody.  Original function string: ${attribsCopy.onclick}.  Error: ${e.message}`);
      // eslint-disable-next-line no-console
      console.error('Error parsing onclick attribute', e);
    }
  }
  if ('onchange' in attribsCopy) {
    try {
      attribsCopy.onChange = new Function(attribsCopy.onchange);
      delete attribsCopy.onchange;  
    } catch (e) {
      captureException(`Error parsing onchange attribute in ContentItemBody.  Original function string: ${attribsCopy.onchange}.  Error: ${e.message}`);
      // eslint-disable-next-line no-console
      console.error('Error parsing onchange attribute', e);
    }
  }

  for (const attribKey of Object.keys(attribsCopy)) {
    if (attribKey in mapAttributeNames) {
      attribsCopy[mapAttributeNames[attribKey]] = attribsCopy[attribKey];
      delete attribsCopy[attribKey];
    }
  }
  return attribsCopy;
}

/**
 * Mapping from HTML attribute names as they appear in HTML, to attribute names as React
 * wants them (ie, with camel-casing). Missing mappings will cause warnings from React,
 *  which look like:
 *   ```Invalid DOM property `allowfullscreen`. Did you mean `allowFullScreen`?```
 * Which don't break anything important but are spammy.
 */
const mapAttributeNames: Record<string,string> = {
  "srcset": "srcSet",
  "class": "className",
  "colspan": "colSpan",
  "columnspan": "columnSpan",
  "rowspan": "rowSpan",
  "allowfullscreen": "allowFullScreen",
  "for": "htmlFor",
}

function camelCaseCssAttribute(input: string) {
  return input.replace(/-([a-z])/g, (_, char) => char.toUpperCase())
}

export function parseInlineStyle(input: string): CSSProperties {
  return input.split(';').reduce((obj, kv) => {
    let [key, val] = kv.split(':')
    key = key?.trim()
    val = val?.trim()
    if (key && val) {
      obj[camelCaseCssAttribute(key) as keyof CSSProperties] = val as any
    }
    return obj
  }, {} as CSSProperties)
}

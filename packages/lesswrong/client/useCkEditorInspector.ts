import { RefObject } from "react";
import { useGlobalKeydown } from "@/components/common/withGlobalKeydown";
import type CKEditor from "@/lib/vendor/ckeditor5-react/ckeditor";

export function useCkEditorInspector(editorRef: RefObject<CKEditor<any>|null>) {
  useGlobalKeydown(ev => {
    if (!bundleIsProduction) {
      if (editorRef.current?.editor && ev.key === 'D' && ev.ctrlKey && ev.shiftKey) {
        // Required inline so that esbuild can drop the inspector from production bundles
        const CKEditorInspector = require("@ckeditor/ckeditor5-inspector");
        //eslint-disable-next-line no-console
        console.log("Attaching CkEditor inspector");
        CKEditorInspector.attach(editorRef.current?.editor);
      }
    }
  });
}

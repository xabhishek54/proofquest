import React, { useEffect, useRef } from "react";
import { EditorState, StateField, StateEffect, RangeSet } from "@codemirror/state";
import { EditorView, lineNumbers, highlightActiveLineGutter, highlightActiveLine, keymap, Decoration, DecorationSet, GutterMarker, gutter } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { LineDiagnostic, BoardSnapshot } from "../types.js";

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  diagnostics: LineDiagnostic[];
  boardSnapshots: BoardSnapshot[];
  onVerify?: () => void;
}

// Marker for CodeMirror Gutter
class StatusGutterMarker extends GutterMarker {
  type: "success" | "error" | "warning";

  constructor(type: "success" | "error" | "warning") {
    super();
    this.type = type;
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = `pq-gutter-marker pq-marker-${this.type}`;
    if (this.type === "success") {
      span.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      span.title = "Step verified by Lean";
    } else if (this.type === "error") {
      span.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
      span.title = "Error on this line";
    } else {
      span.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      span.title = "Warning";
    }
    return span;
  }
}

// State effects for updating decorations and markers
const setDiagnosticsEffect = StateEffect.define<{
  diagnostics: LineDiagnostic[];
  boardSnapshots: BoardSnapshot[];
}>();

const lineDecorationField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const e of tr.effects) {
      if (e.is(setDiagnosticsEffect)) {
        const { diagnostics } = e.value;
        const firstError = diagnostics.find(d => d.severity === "error");
        const decos: any[] = [];
        const doc = tr.state.doc;

        if (firstError) {
          const errLineNum = Math.min(firstError.line, doc.lines);
          const errLine = doc.line(errLineNum);
          decos.push(
            Decoration.line({ class: "pq-line-error" }).range(errLine.from)
          );

          // Grey out succeeding lines after first error
          for (let l = errLineNum + 1; l <= doc.lines; l++) {
            const nextLine = doc.line(l);
            decos.push(
              Decoration.line({ class: "pq-line-greyed" }).range(nextLine.from)
            );
          }
        }

        return RangeSet.of(decos, true);
      }
    }
    return decorations.map(tr.changes);
  },
  provide: f => EditorView.decorations.from(f)
});

const statusGutterField = StateField.define<RangeSet<GutterMarker>>({
  create() {
    return RangeSet.empty;
  },
  update(markers, tr) {
    for (const e of tr.effects) {
      if (e.is(setDiagnosticsEffect)) {
        const { diagnostics, boardSnapshots } = e.value;
        const doc = tr.state.doc;
        const newMarkers: any[] = [];

        // Markers for successful tactic steps
        const successfulLines = new Set<number>();
        for (const snap of boardSnapshots) {
          if (snap.playerLine <= doc.lines) {
            successfulLines.add(snap.playerLine);
          }
        }

        for (const pLine of successfulLines) {
          const lineObj = doc.line(pLine);
          newMarkers.push(new StatusGutterMarker("success").range(lineObj.from));
        }

        // Marker for error line
        for (const diag of diagnostics) {
          if (diag.severity === "error" && diag.line <= doc.lines) {
            const lineObj = doc.line(diag.line);
            newMarkers.push(new StatusGutterMarker("error").range(lineObj.from));
          }
        }

        return RangeSet.of(newMarkers, true);
      }
    }
    return markers.map(tr.changes);
  }
});

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  diagnostics,
  boardSnapshots,
  onVerify
}) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isInternalUpdateRef = useRef(false);

  useEffect(() => {
    if (!editorContainerRef.current) return;

    const startState = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        gutter({
          class: "pq-status-gutter",
          markers: v => v.state.field(statusGutterField)
        }),
        lineDecorationField,
        statusGutterField,
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          {
            key: "Mod-Enter",
            run: () => {
              if (onVerify) onVerify();
              return true;
            }
          }
        ]),
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            isInternalUpdateRef.current = true;
            onChange(update.state.doc.toString());
            isInternalUpdateRef.current = false;
          }
        })
      ]
    });

    const view = new EditorView({
      state: startState,
      parent: editorContainerRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Sync external code changes
  useEffect(() => {
    const view = viewRef.current;
    if (view && !isInternalUpdateRef.current) {
      const currentDoc = view.state.doc.toString();
      if (currentDoc !== code) {
        view.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: code }
        });
      }
    }
  }, [code]);

  // Dispatch diagnostics updates to decorate editor
  useEffect(() => {
    const view = viewRef.current;
    if (view) {
      view.dispatch({
        effects: setDiagnosticsEffect.of({ diagnostics, boardSnapshots })
      });
    }
  }, [diagnostics, boardSnapshots]);

  return <div className="cm-editor-container" ref={editorContainerRef} />;
};

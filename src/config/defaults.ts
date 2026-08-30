import type { Node } from "@xyflow/react";
import type { RequestInputField } from "@/types/node.type";

export const DEFAULT_INITIAL_NODES: Node[] = [
  {
    id: "request_inputs",
    type: "requestInput",
    position: { x: 50, y: 150 },
    data: {
      fields: [
        {
          id: "text_field",
          type: "text_field",
          label: "Text Field",
          value: "",
        },
        {
          id: "image_field",
          type: "image_field",
          label: "Image Field",
          value: "",
        },
      ] as RequestInputField[],
    },
    deletable: false,
  },
  {
    id: "response",
    type: "response",
    position: { x: 900, y: 250 },
    data: {
      results: [],
    },
    deletable: false,
  },
];

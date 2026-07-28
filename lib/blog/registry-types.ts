import type { ComponentType } from "react";

export type MdxContentModule = {
  default: ComponentType;
};

export type MdxPostLoader = () => Promise<MdxContentModule>;

import {
  RiArrowDownLine,
  RiArrowDownSLine,
  RiArrowRightLine,
  RiArrowRightSLine,
  RiArrowUpLine,
  RiBookOpenLine,
  RiChatAiLine,
  RiCheckboxCircleLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiCloseLine,
  RiCodeBoxLine,
  RiCornerDownLeftLine,
  RiCursorLine,
  RiExternalLinkLine,
  RiFileCopyLine,
  RiFileTextLine,
  RiFolderLine,
  RiGitForkLine,
  RiGitRepositoryLine,
  RiGithubLine,
  RiGlobalLine,
  RiInformationLine,
  RiLightbulbLine,
  RiLoginBoxLine,
  RiMoonLine,
  RiNewsLine,
  RiSearchLine,
  RiStarLine,
  RiSunLine,
} from "@remixicon/react";
import type { IconSet } from "@heyo-sh/heyo-docs";

/**
 * This mapping is intentionally local to the generated application. Replace
 * it with another pack to change the built-in UI without bundling all packs.
 */
const remixIconSet = {
  book: RiBookOpenLine,
  changelog: RiNewsLine,
  code: RiCodeBoxLine,
  file: RiFileTextLine,
  github: RiGithubLine,
  globe: RiGlobalLine,
  signIn: RiLoginBoxLine,
  chevronDown: RiArrowDownSLine,
  chevronRight: RiArrowRightSLine,
  arrowDown: RiArrowDownLine,
  arrowUp: RiArrowUpLine,
  arrowRight: RiArrowRightLine,
  close: RiCloseLine,
  cornerDownLeft: RiCornerDownLeftLine,
  search: RiSearchLine,
  sun: RiSunLine,
  moon: RiMoonLine,
  checkCircle: RiCheckboxCircleLine,
  check: RiCheckLine,
  closeCircle: RiCloseCircleLine,
  externalLink: RiExternalLinkLine,
  folder: RiFolderLine,
  gitFork: RiGitForkLine,
  gitRepository: RiGitRepositoryLine,
  information: RiInformationLine,
  lightbulb: RiLightbulbLine,
  copy: RiFileCopyLine,
  star: RiStarLine,
  bot: RiChatAiLine,
  cursor: RiCursorLine,
  chat: RiChatAiLine,
};

/**
 * A generated project can temporarily resolve the icon package and Heyo Docs
 * through distinct React type installations (notably with file dependencies).
 * The runtime contract is identical SVG props, so expose the local mapping as
 * the framework-neutral icon contract after keeping the imports tree-shakeable.
 */
export const iconSet = remixIconSet as unknown as Required<IconSet>;

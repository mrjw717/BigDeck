// ============================================================================
// BigDeck - Action Engine (Facade)
// Orchestrates action execution and key rendering
// ============================================================================

import type {
  Action,
  KeyConfig,
  DeviceType,
  MacroStep,
  MediaPlayerInfo,
  SdPluginAction,
  ActionOrigin,
} from "../../shared/types";
import type { Logger } from "../utils/Logger";
import { ActionExecutor } from "./ActionExecutor";
import { KeyRenderer, type RenderedKey } from "./KeyRenderer";

export class ActionEngine {
  private executor: ActionExecutor;
  private renderer: KeyRenderer;

  constructor(logger: Logger, userDataPath: string) {
    this.executor = new ActionExecutor(logger);
    this.renderer = new KeyRenderer(logger, userDataPath);
  }

  setOnSwitchProfile(handler: (profileId: string) => Promise<void>): void {
    this.executor.onSwitchProfile = handler;
  }

  setOnSwitchPage(handler: (pageIndex: number) => Promise<void>): void {
    this.executor.onSwitchPage = handler;
  }

  setOnSdPluginDispatch(
    handler: (action: SdPluginAction, origin?: ActionOrigin) => Promise<void>,
  ): void {
    this.executor.onSdPluginDispatch = handler;
  }

  async executeAction(action: Action, origin?: ActionOrigin): Promise<void> {
    return this.executor.executeAction(action, origin);
  }

  async renderKeyImage(
    keyConfig: KeyConfig,
    deviceType: DeviceType = "original",
    pressed: boolean = false,
  ): Promise<Buffer | Buffer[]> {
    return this.renderer.renderKeyImage(keyConfig, deviceType, pressed);
  }

  async renderKeyImageEx(
    keyConfig: KeyConfig,
    deviceType: DeviceType = "original",
    pressed: boolean = false,
  ): Promise<RenderedKey> {
    return this.renderer.renderKeyImageEx(keyConfig, deviceType, pressed);
  }

  async getAnimationDelays(keyConfig: KeyConfig): Promise<number[]> {
    return this.renderer.getAnimationDelays(keyConfig);
  }

  async getMediaPlayers(): Promise<MediaPlayerInfo[]> {
    return this.renderer.getMediaPlayers();
  }

  startMacroRecording(): void {
    this.executor.startMacroRecording();
  }

  stopMacroRecording(): MacroStep[] {
    return this.executor.stopMacroRecording();
  }
}

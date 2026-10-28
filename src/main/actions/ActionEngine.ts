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
  ProfilePage,
  SdPluginAction,
  ActionOrigin,
} from "../../shared/types";
import type { Logger } from "../utils/Logger";
import {
  ActionExecutor,
  type KeyboardInjectionStatus,
} from "./ActionExecutor";
import { KeyRenderer, type RenderedKey } from "./KeyRenderer";
import {
  ActionTickService,
  type TickImageSink,
} from "./ActionTickService";

export class ActionEngine {
  private executor: ActionExecutor;
  private renderer: KeyRenderer;
  /** Per-key tick renderer registry (timer/clock displays). */
  readonly tickService: ActionTickService;

  constructor(logger: Logger, userDataPath: string) {
    this.tickService = new ActionTickService(logger);
    this.executor = new ActionExecutor(logger, this.tickService);
    this.renderer = new KeyRenderer(logger, userDataPath);
  }

  /**
   * Wire the tick pipeline into the hardware (called by the app entry point
   * where DeviceManager + HardwareSync live — see ActionTickService).
   */
  setTickSink(sink: TickImageSink): void {
    this.tickService.setSink(sink);
  }

  /** Stop the tick interval (app shutdown cleanup). */
  stopTickService(): void {
    this.tickService.stop();
  }

  /** Keep clock displays in sync with a page's placements (page applies). */
  syncClocks(
    deviceId: string,
    deviceType: DeviceType,
    page: ProfilePage | undefined,
  ): void {
    this.executor.syncClocks(deviceId, deviceType, page);
  }

  setOnSwitchProfile(handler: (profileId: string) => Promise<void>): void {
    this.executor.onSwitchProfile = handler;
  }

  setOnSwitchPage(handler: (pageIndex: number) => Promise<void>): void {
    this.executor.onSwitchPage = handler;
  }

  /** Relative page navigation (page.next / page.previous). */
  setOnSwitchPageRelative(handler: (delta: number) => Promise<void>): void {
    this.executor.onSwitchPageRelative = handler;
  }

  /** Forget all Hotkey Switch toggle states (profile switches). */
  resetHotkeySwitchStates(): void {
    this.executor.resetHotkeySwitchStates();
  }

  setOnSdPluginDispatch(
    handler: (action: SdPluginAction, origin?: ActionOrigin) => Promise<void>,
  ): void {
    this.executor.onSdPluginDispatch = handler;
  }

  setOnKeyBrightness(
    handler: (deviceId: string | null, brightness: number) => Promise<boolean>,
  ): void {
    this.executor.onKeyBrightness = handler;
  }

  async executeAction(action: Action, origin?: ActionOrigin): Promise<void> {
    return this.executor.executeAction(action, origin);
  }

  /**
   * Push-to-talk HOLD: press (unmute system mic). Paired with releasePtt
   * on key up. Delegates to the executor's pactl press/release.
   */
  async pressPtt(keyIndex: number): Promise<boolean> {
    return this.executor.pressPtt(keyIndex);
  }

  async releasePtt(keyIndex: number): Promise<boolean> {
    return this.executor.releasePtt(keyIndex);
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

  /** Injection backend availability for the Settings diagnostics card. */
  async getKeyboardInjectionStatus(): Promise<KeyboardInjectionStatus> {
    return this.executor.getKeyboardInjectionStatus();
  }

  /** Harmless modifiers-only tap through the real injection chain. */
  async testKeyboardInjection(): Promise<boolean> {
    return this.executor.testKeyboardInjection();
  }

  startMacroRecording(): void {
    this.executor.startMacroRecording();
  }

  stopMacroRecording(): MacroStep[] {
    return this.executor.stopMacroRecording();
  }
}

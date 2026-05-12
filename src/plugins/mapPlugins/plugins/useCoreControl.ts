import type OlMap from 'ol/Map';
import type Control from 'ol/control/Control';
import { FullScreen, OverviewMap, ScaleLine, ZoomSlider, ZoomToExtent } from 'ol/control';
import type { MapPlugin } from '../core/types';

export type ControlId = string;

export interface CoreControlPluginOptions {
  defaults?: boolean;
  extent?: [number, number, number, number];
}

export class CoreControlPlugin implements MapPlugin {
  public readonly key = 'coreControl';
  private map?: OlMap;
  private readonly controls = new Map<ControlId, Control>();

  constructor(private readonly options: CoreControlPluginOptions = {}) {}

  public apply(map: OlMap): void {
    this.map = map;
    if (this.options.defaults !== false) {
      this.add('zoomSlider', new ZoomSlider());
      this.add('fullScreen', new FullScreen());
      this.add('scaleLine', new ScaleLine());
      this.add('overview', new OverviewMap());
      this.add('zoomToExtent', new ZoomToExtent({ extent: this.options.extent }));
    }
  }

  public add(id: ControlId, control: Control): this {
    this.controls.set(id, control);
    this.map?.addControl(control);
    return this;
  }

  public remove(id: ControlId): boolean {
    const c = this.controls.get(id);
    if (!c || !this.map) return false;
    this.map.removeControl(c);
    this.controls.delete(id);
    return true;
  }

  public dispose(): void {
    if (!this.map) return;
    for (const [, c] of this.controls) this.map.removeControl(c);
    this.controls.clear();
    this.map = undefined;
  }
}

export const useCoreControl = (options?: CoreControlPluginOptions) => new CoreControlPlugin(options);

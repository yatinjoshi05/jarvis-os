import { Widget } from './interfaces';
import { dashboardStore } from './store';
import { dashboardEventEmitter, DashboardEvents } from './events';
import { WidgetNotFoundError } from './errors';

class WidgetManager {
  public getWidgets(): Widget[] {
    return dashboardStore.getState().widgets;
  }

  public registerWidget(widget: Widget) {
    const widgets = this.getWidgets();
    if (widgets.find((w) => w.id === widget.id)) {
      throw new Error(`Widget with ID "${widget.id}" already registered.`);
    }

    dashboardStore.setState({ widgets: [...widgets, widget] });
    dashboardEventEmitter.emit(DashboardEvents.WIDGET_OPENED, widget);
  }

  public unregisterWidget(widgetId: string) {
    const widgets = this.getWidgets();
    const updated = widgets.filter((w) => w.id !== widgetId);
    dashboardStore.setState({ widgets: updated });
    dashboardEventEmitter.emit(DashboardEvents.WIDGET_CLOSED, { id: widgetId });
  }

  public setWidgetVisibility(widgetId: string, visible: boolean) {
    const widgets = this.getWidgets();
    const widget = widgets.find((w) => w.id === widgetId);
    if (!widget) {
      throw new WidgetNotFoundError(widgetId);
    }

    widget.isVisible = visible;
    dashboardStore.setState({ widgets: [...widgets] });
    
    if (visible) {
      dashboardEventEmitter.emit(DashboardEvents.WIDGET_OPENED, widget);
    } else {
      dashboardEventEmitter.emit(DashboardEvents.WIDGET_CLOSED, { id: widgetId });
    }
  }

  public updateWidgetOrder(widgetId: string, order: number) {
    const widgets = this.getWidgets();
    const widget = widgets.find((w) => w.id === widgetId);
    if (!widget) {
      throw new WidgetNotFoundError(widgetId);
    }

    widget.order = order;
    // Re-sort array
    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    dashboardStore.setState({ widgets: sorted });
  }
}

export const widgetManager = new WidgetManager();
export default widgetManager;

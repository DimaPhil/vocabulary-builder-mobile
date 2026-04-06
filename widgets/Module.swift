import ExpoModulesCore
import WidgetKit

public class ReactNativeWidgetExtensionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ReactNativeWidgetExtension")

    Function("reloadAllTimelines") {
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
  }
}

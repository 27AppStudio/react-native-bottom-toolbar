#import "BottomToolbar.h"

#import <React/RCTConvert.h>
#import <React/RCTUtils.h>
#import <UIKit/UIKit.h>

/**
 * UIKit's own bottom toolbar for a screen of a native stack, so its items are the
 * system's: on iOS 26 a lone trailing item is drawn as a glass circle (as Photos'
 * bin), before that as the classic toolbar. Its items belong to the navigation
 * controller's top screen; the JS side shows it when that screen is reached and
 * hides it on leave.
 */
@implementation BottomToolbar {
  __weak UIViewController *_owner;
  /** The navigation bar's tint, as last read undimmed. */
  UIColor *_barTint;
}

+ (NSString *)moduleName
{
  return @"BottomToolbar";
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

/** The innermost navigation controller on screen, skipping a modal being dismissed. */
static UINavigationController *VisibleNavigationController(void)
{
  UIViewController *controller = RCTKeyWindow().rootViewController;
  UINavigationController *navigation = nil;
  while (controller != nil) {
    UIViewController *presented = controller.presentedViewController;
    if (presented != nil && !presented.isBeingDismissed) {
      controller = presented;
    } else if ([controller isKindOfClass:[UINavigationController class]]) {
      navigation = (UINavigationController *)controller;
      controller = navigation.topViewController;
    } else {
      controller = controller.childViewControllers.lastObject;
    }
  }
  return navigation;
}

- (UIBarButtonItem *)barItemFor:(NSDictionary *)item
{
  NSString *type = item[@"type"];
  if ([type isEqualToString:@"flexibleSpace"]) {
    return [UIBarButtonItem flexibleSpaceItem];
  }
  if ([type isEqualToString:@"fixedSpace"]) {
    return [UIBarButtonItem fixedSpaceItemOfWidth:[item[@"width"] doubleValue]];
  }

  __weak BottomToolbar *weakSelf = self;
  NSString *itemId = item[@"id"];
  UIBarButtonItem *barItem = [[UIBarButtonItem alloc]
      initWithPrimaryAction:[UIAction actionWithHandler:^(UIAction *action) {
        [weakSelf emitOnItemPress:itemId];
      }]];
  NSString *systemImage = item[@"systemImage"];
  UIImage *image = systemImage != nil ? [UIImage systemImageNamed:systemImage] : nil;
  if (image != nil) {
    barItem.image = image;
  } else {
    barItem.title = item[@"title"];
  }
  barItem.accessibilityLabel = item[@"accessibilityLabel"];
  barItem.enabled = ![item[@"disabled"] boolValue];
  return barItem;
}

- (void)show:(NSArray *)items options:(JS::NativeBottomToolbar::NativeToolbarOptions &)options
{
  // Back on the screen that already had the toolbar (a modal on it was dismissed): use it.
  // The visible navigation controller could still be the modal's, as JS refocuses this
  // screen before UIKit starts the dismissal.
  UIViewController *owner = _owner;
  UINavigationController *navigation = owner.navigationController;
  if (navigation == nil || navigation.topViewController != owner) {
    owner = nil;
    navigation = VisibleNavigationController();
  }
  if (navigation == nil) {
    return;
  }

  NSMutableArray<UIBarButtonItem *> *barItems = [NSMutableArray array];
  BOOL hasSpace = NO;
  for (NSDictionary *item in items) {
    hasSpace = hasSpace || ![item[@"type"] isEqualToString:@"button"];
    [barItems addObject:[self barItemFor:item]];
  }
  // Without spacers the items go to the trailing edge, where iOS 26 draws a lone one
  // as a glass circle.
  if (!hasSpace) {
    [barItems insertObject:[UIBarButtonItem flexibleSpaceItem] atIndex:0];
  }
  std::optional<double> tintColor = options.tintColor();
  UIColor *tint = tintColor.has_value() ? [RCTConvert UIColor:@(tintColor.value())] : nil;

  void (^apply)(void) = ^{
    // A first show reads the top screen once any push has landed, so the items go to
    // the screen now on top.
    UIViewController *target = owner ?: navigation.topViewController;
    // Each item's tint, as iOS 26 glass ignores the toolbar's. By default the header's
    // own items' colour, not the system blue; read only while undimmed, as before iOS 26
    // the bar still reports its dimmed grey when back from a modal.
    if (navigation.navigationBar.tintAdjustmentMode != UIViewTintAdjustmentModeDimmed) {
      self->_barTint = navigation.navigationBar.tintColor;
    }
    for (UIBarButtonItem *barItem in barItems) {
      barItem.tintColor = tint ?: self->_barTint;
    }
    self->_owner = target;
    [target setToolbarItems:barItems animated:NO];
    [navigation setToolbarHidden:NO animated:YES];
  };

  id<UIViewControllerTransitionCoordinator> coordinator = navigation.transitionCoordinator;
  if (coordinator != nil) {
    [coordinator animateAlongsideTransition:nil
                                 completion:^(id _Nonnull context) {
                                   apply();
                                 }];
  } else {
    apply();
  }
}

- (void)hide
{
  // The owner is kept (weakly) for the next `show`: a modal over it hides the toolbar,
  // and its dismissal brings it back on the same screen.
  UIViewController *owner = _owner;
  UINavigationController *navigation =
      owner.navigationController ?: VisibleNavigationController();
  [owner setToolbarItems:nil animated:NO];
  [navigation setToolbarHidden:YES animated:YES];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeBottomToolbarSpecJSI>(params);
}

@end

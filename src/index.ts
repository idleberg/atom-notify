import meta from '../package.json';

import { CompositeDisposable } from 'atom';
import Config from './config';
import { mapNotificationType } from './util';
import Logger from "./log";
import notify from './notify';

export default {
  config: Config.schema,
  contentImage: null,
  icon: null,
  showWhenFocused: false,
  subscriptions: new CompositeDisposable(),

  async activate(): Promise<void> {
    Logger.log('Activating package');

    this.showWhenFocused = Config.get('showWhenFocused');
    atom.config.observe(`${meta.name}.showWhenFocused`, currentValue => {
      this.showWhenFocused = currentValue;
    });

    if (Config.get('injectNotifications')) {
      this.subscriptions.add(atom.notifications.onDidAddNotification(Notification => {
        if (this.showWhenFocused || document.body.classList.contains('is-blurred')) {
          if (Notification) return this.intercept(Notification);
        }
      }));
    }

    if (atom.inDevMode()) {
      if (Config.get('developer.enableCommands')) {
        this.subscriptions.add(
          atom.commands.add('atom-workspace', {
            'notify:show-error': () => this.notify({
              title: 'Error',
              message: 'This is a demo message',
              type: 'error'
            })
          }),

          atom.commands.add('atom-workspace', {
            'notify:show-fatal-error': () => this.notify({
              title: 'Fatal Error',
              message: 'This is a demo message',
              type: 'fatalError'
            })
          }),

          atom.commands.add('atom-workspace', {
            'notify:show-info': () => this.notify({
              title: 'Info',
              message: 'This is a demo message',
              type: 'info'
            })
          }),

          atom.commands.add('atom-workspace', {
            'notify:show-success': () => this.notify({
              title: 'Success',
              message: 'This is a demo message',
              type: 'success'
            })
          }),

          atom.commands.add('atom-workspace', {
            'notify:show-warning': () => this.notify({
              title: 'Warning',
              message: 'This is a demo message',
              type: 'warn'
            })
          }),
        );
      }

      if (Config.get('developer.exposeToWindow')) {
        window['notify'] = notify;
      }
    }
  },

  intercept(notification: Notification): void {
    const type = mapNotificationType((notification as any).getType().toLowerCase());
    const title = (notification as any).getMessage();
    const message = (notification as any).getDetail();
    const { dismissable } = (notification as any).getOptions();

    const params = {
      type: type,
      title: title,
      message: message,
      wait: dismissable,
      timeout: dismissable
        ? undefined
        : atom.config.get('notifications.defaultTimeout')
    };

    this.notify(params);
  },

  notify(notifyOptions: Notification): void {
    const params = {
      ...notifyOptions
    };

    notify[notifyOptions['type']](params);
  },

  deactivate(): void {
    Logger.log('Deactivating package');

    this.subscriptions?.dispose();
  },


  provideNotify(): unknown {
    Logger.log('Providing service');

    return this.notify;
  }
};

import { AppSyncResolverEvent } from 'aws-lambda';
import { mixpanel } from '@libs/setup';

export const handler = async (
  event: AppSyncResolverEvent<Arguments>
): Promise<void> => {
  const { action, event: mixpanelEvent, properties } = event.arguments;

  const props = { ...properties, $ip: socket.ip };
  switch (action) {
    case 'people':
      mixpanel.people.set(mixpanelEvent, props);
      break;
    case 'track':
      mixpanel.track(mixpanelEvent, props);
      break;
    default:
      break;
  }
  return 200;
};

export type Arguments = { action: Action; event: string; properties: AWSJSON };

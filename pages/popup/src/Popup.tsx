import '@src/Popup.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { useEffect, useState } from 'react';
import { Events } from '@src/Events';
import { EventDetails } from '@src/EventDetails';

export interface RawEvent {
  date: number;
  id: string | null;
  clientId: string | null;
  userId: string | null;
  deviceId: string;
  userIp: string;
  url: string;
  testGroupName: null;
  pageId: string;
  eventId: string;
  prevPageId: string | null;
  prevEventId: string | null;
  previousEvent: string | null;
  event: {
    type: string;
    index: number;
    amplitude: {
      project: string;
      ip: string;
      event_type: string;
      user_id: string | null;
      device_id: string;
      time: string;
      url: string;
      event_properties: Record<string, unknown>;
      user_properties: Record<string, unknown>;
      user_agent: string;
      os_name: string;
      os_version: string;
      device_manufacturer: string;
      device_model: string;
      platform: string;
    };
  };
}

export interface EventLog {
  id: string;
  date: Date;
  data: RawEvent;
}

const Popup = () => {
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const selectedEvent = eventLogs.find(({ id }) => id === selectedEventId) ?? null;

  useEffect(() => {
    const handler = (details: chrome.webRequest.WebRequestBodyDetails) => {
      const eventLog = getEventLogFromRequestBody(details);

      if (eventLog) {
        setEventLogs(prev => [...prev, eventLog]);
      }
    };

    chrome.webRequest.onBeforeRequest.addListener(
      handler,
      { urls: ['https://kinesis.ap-northeast-2.amazonaws.com/*'] },
      ['requestBody'],
    );

    return () => chrome.webRequest.onBeforeRequest.removeListener(handler);
  }, []);

  return (
    <div className="absolute inset-0 text-center h-full w-full bg-zinc-900 grid grid-cols-1 grid-rows-[48px_552px]">
      <header className="text-zinc-100 border-b-[0.5px] border-b-zinc-600">
        <p>{eventLogs.map(({ date }) => date.toLocaleDateString())}</p>
      </header>
      <main className="w-full grid grid-cols-[3fr_4fr] flex-1">
        <section className="border-r-[0.5px] border-r-zinc-600 overflow-y-auto overflow-x-hidden">
          <Events events={eventLogs} selectedEventId={selectedEventId} onClickEvent={setSelectedEventId} />
        </section>
        <section className="overflow-y-auto overflow-x-hidden">
          <EventDetails event={selectedEvent} />
        </section>
      </main>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);

function getEventLogFromRequestBody(details: chrome.webRequest.WebRequestBodyDetails): EventLog | null {
  if (details.method === 'POST' && details.requestBody) {
    const arrayBuffer = details.requestBody.raw?.[0]?.bytes;

    if (!arrayBuffer) {
      return null;
    }

    const textDecoder = new TextDecoder();
    const decodedString = textDecoder.decode(arrayBuffer);
    const kinesisJson = JSON.parse(decodedString) as { Data: string; PartitionKey: string; StreamName: string };
    const eventJson: RawEvent = JSON.parse(window.atob(kinesisJson.Data));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventJson.event = JSON.parse(eventJson.event as any) as RawEvent['event'];

    return {
      id: eventJson.eventId,
      date: new Date(eventJson.date),
      data: eventJson,
    };
  }
  return null;
}

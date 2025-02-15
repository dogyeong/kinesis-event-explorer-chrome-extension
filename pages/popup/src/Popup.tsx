import '@src/Popup.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import type { PropsWithChildren } from 'react';
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
  date: number;
  data: RawEvent;
}

const Popup = () => {
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const selectedEvent = eventLogs.find(({ id }) => id === selectedEventId) ?? null;

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_EVENTS' }, (response: RawEvent[]) => {
      setEventLogs(response.map(event => ({ id: event.eventId, date: event.date, data: event })));
    });
  }, []);

  useEffect(() => {
    const handler = (message: { type: string; events: RawEvent[] }) => {
      if (message?.type === 'UPDATE_EVENTS') {
        setEventLogs(message.events.map(event => ({ id: event.eventId, date: event.date, data: event })));
      }
    };
    chrome.runtime.onMessage.addListener(handler);

    return () => {
      chrome.runtime.onMessage.removeListener(handler);
    };
  }, []);

  function clearEvents() {
    chrome.runtime.sendMessage({ type: 'CLEAR_EVENTS' });
  }

  return (
    <div className="absolute inset-0 text-center h-full w-full bg-zinc-900 grid grid-cols-1 grid-rows-[48px_552px]">
      <header className="text-zinc-100 border-b-[0.5px] border-b-zinc-600 flex items-center px-[16px]">
        <Button onClick={clearEvents}>초기화</Button>
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

function Button({ children, onClick }: PropsWithChildren<{ onClick: VoidFunction }>) {
  return (
    <button
      type="button"
      className="px-[12px] py-[4px] border-[0.5px] border-zinc-600 rounded-[4px] hover:bg-zinc-800 transition-[background-color] active:bg-zinc-700"
      onClick={onClick}>
      {children}
    </button>
  );
}

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);

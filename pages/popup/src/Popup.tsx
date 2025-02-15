import '@src/Popup.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { useEffect, useState } from 'react';
import { Events } from '@src/Events';

export interface EventLog {
  id: string;
  date: Date;
  data: Record<string, unknown>;
}

const Popup = () => {
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

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
      <main className="w-full grid grid-cols-2 flex-1">
        <section className="border-r-[0.5px] border-r-zinc-600 text-zinc-100 overflow-y-auto overflow-x-hidden min-h-0">
          <Events events={eventLogs} selectedEventId={selectedEventId} onClickEvent={setSelectedEventId} />
        </section>
        <section className="text-zinc-100">세부 정보를 확인하려면 이벤트를 클릭하세요.</section>
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
    const eventJson = JSON.parse(window.atob(kinesisJson.Data));
    eventJson.event = JSON.parse(eventJson.event);

    return {
      id: eventJson.eventId,
      date: new Date(eventJson.date),
      data: eventJson,
    };
  }
  return null;
}

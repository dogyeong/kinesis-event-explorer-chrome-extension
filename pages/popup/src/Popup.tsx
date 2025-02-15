import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { useEffect, useState, type ComponentPropsWithoutRef } from 'react';

interface EventLog {
  createdAt: Date;
  data: Record<string, unknown>;
}

const Popup = () => {
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);

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
    <div className={`App bg-gray-800`}>
      <header className={`App-header text-gray-100`}>
        <p>
          Edit <code>pages/popup/src/Popup.tsx</code>
        </p>
        <p>{eventLogs.map(({ createdAt }) => createdAt.toLocaleDateString())}</p>
        <button className={'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 bg-gray-700 text-white'}>
          Click to inject Content Script
        </button>
        <ToggleButton>Toggle theme</ToggleButton>
      </header>
    </div>
  );
};

const ToggleButton = (props: ComponentPropsWithoutRef<'button'>) => {
  const theme = useStorage(exampleThemeStorage);
  return (
    <button
      className={
        props.className +
        ' ' +
        'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 ' +
        (theme === 'light' ? 'bg-white text-black shadow-black' : 'bg-black text-white')
      }
      onClick={exampleThemeStorage.toggle}>
      {props.children}
    </button>
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
    const jsonObject = JSON.parse(decodedString);

    return {
      createdAt: new Date(),
      data: jsonObject,
    };
  }
  return null;
}

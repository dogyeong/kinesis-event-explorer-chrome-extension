import 'webextension-polyfill';

const events: unknown[] = [];

chrome.webRequest.onBeforeRequest.addListener(
  details => {
    const event = getEventLogFromRequestBody(details);
    if (event) {
      events.push(event);
      chrome.runtime.sendMessage({ type: 'UPDATE_EVENTS', events });
    }
  },
  { urls: ['https://kinesis.ap-northeast-2.amazonaws.com/*'] },
  ['requestBody'],
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'GET_EVENTS') {
    sendResponse(events);
  }
});

chrome.runtime.onMessage.addListener(message => {
  if (message?.type === 'CLEAR_EVENTS') {
    events.length = 0;
    chrome.runtime.sendMessage({ type: 'UPDATE_EVENTS', events });
  }
});

function getEventLogFromRequestBody(details: chrome.webRequest.WebRequestBodyDetails) {
  if (details.method === 'POST' && details.requestBody) {
    const arrayBuffer = details.requestBody.raw?.[0]?.bytes;

    if (!arrayBuffer) {
      return null;
    }

    const textDecoder = new TextDecoder();
    const decodedString = textDecoder.decode(arrayBuffer);
    const kinesisJson = JSON.parse(decodedString) as { Data: string; PartitionKey: string; StreamName: string };
    const rawEvent = JSON.parse(atob(kinesisJson.Data));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rawEvent.event = JSON.parse(rawEvent.event as any);

    return rawEvent;
  }
  return null;
}

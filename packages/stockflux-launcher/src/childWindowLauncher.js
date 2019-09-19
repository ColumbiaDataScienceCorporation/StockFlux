import { OpenfinApiHelpers } from 'stockflux-core';

async function createChildWindow(options) {
  const application = await window.fin.Application.getCurrent();
  const childWindows = await application.getChildWindows();
  const currentWindow = await window.fin.Window.getCurrent();
  const currentOptions = await currentWindow.getOptions();

  options.uuid = currentOptions.uuid;

  for (let i = 0; i < childWindows.length; i++) {
    const childWindowOptions = await childWindows[i].getOptions();
    if (childWindowOptions.name === options.name) {
      if (childWindows[i]) {
        childWindows[i].bringToFront();
        return true;
      }
      break;
    }
  }

  await OpenfinApiHelpers.createWindow(options);
  return true;
}

async function getChildWindowOptions(manifest) {
  const manifestUrl =
    typeof manifest === 'string' ? manifest : manifest.manifest;

  const response = await fetch(manifestUrl);
  if (!response.ok) {
    throw new Error('Could not retrieve manifest');
  }

  const body = await response.json();
  return body.startup_app;
}

export async function createNewsChildWindow(manifest, symbol, name) {
  return createChild(manifest, o => {
    o.name = `stockflux-news${symbol ? `[${symbol}]` : ''}`;
    if (symbol) {
      o.customData.symbol = symbol;
    }
    if (name) {
      o.customData.name = name;
    }
    return o;
  });
}

export async function createChild(manifest, modifyOptions) {
  modifyOptions = modifyOptions === undefined ? o => o : modifyOptions;

  return await createChildWindow(
    modifyOptions(await getChildWindowOptions(manifest))
  );
}

export async function createWatchlistChildWindow(manifest, symbol) {
  const options = await getChildWindowOptions(manifest);
  await createChildWindow(options);

  try {
    window.fin.InterApplicationBus.send({ uuid: options.uuid }, options.name, {
      symbol
    });
  } catch (err) {
    console.error(err);
  }
}

export async function createChartChildWindow(manifest, symbol, name) {
  return createChild(manifest, o => {
    o.name = `stockflux-chart${symbol ? `[${symbol}]` : ''}`;
    if (symbol) {
      o.customData.symbol = symbol;
    }
    if (name) {
      o.customData.name = name;
    }
    return o;
  });
}
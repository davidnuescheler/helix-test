/*
 * Copyright 2018 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const { inspect } = require('util');
const client = require('request-promise-native');
const { setdefault } = require('ferrum');

/**
 * Fetches the Markdown from google docs
 */
async function fetch(context, secrets, logger, resourcePath, rootId) {
  const content = setdefault(context, 'content', {});

  let timeout;
  if (!secrets.HTTP_TIMEOUT) {
    logger.warn('No HTTP timeout set, risk of denial-of-service');
  } else {
    timeout = secrets.HTTP_TIMEOUT;
  }

  const uri = `${secrets.REPO_RAW_ROOT}?path=${encodeURIComponent(resourcePath)}&rootId=${encodeURIComponent(rootId)}`;

  const options = {
    uri,
    json: true,
    timeout,
    time: true,
    followAllRedirects: true,
  };

  logger.debug(`fetching Markdown from ${options.uri}`);
  try {
    const resp = await client(options);
    // logger.info(JSON.stringify(resp, null, 2));
    if (resp.statusCode === 200) {
      content.body = resp.body;

      // disable caching
      const res = setdefault(context, 'response', {});
      const head = setdefault(res, 'headers', {});
      setdefault(head, 'Cache-Control', 'no-store, private, must-revalidate');

    } else {
      logger.info('failed loading from google docs: ' + resp.statusCode);
      return;
      // const e = new Error('failed loading google docs');
      // e.statusCode = resp.statusCode || 500;
      // throw e;
    }
  } catch (e) {
    if (e.statusCode === 404) {
      logger.error(`Could not find Markdown at ${options.uri}`);
      setdefault(context, 'response', {}).status = 404;
    } else if ((e.response && e.response.elapsedTime && e.response.elapsedTime > timeout) || (e.cause && e.cause.code && (e.cause.code === 'ESOCKETTIMEDOUT' || e.cause.code === 'ETIMEDOUT'))) {
      // return gateway timeout
      logger.error(`Gateway timout of ${timeout} milliseconds exceeded for ${options.uri}`);
      setdefault(context, 'response', {}).status = 504;
    } else {
      logger.error(`Error while fetching Markdown from ${options.uri} with the following `
        + `options:\n${inspect(options, { depth: null })}`);
      setdefault(context, 'response', {}).status = 502;
    }
    context.error = e;
  }
}

module.exports = fetch;

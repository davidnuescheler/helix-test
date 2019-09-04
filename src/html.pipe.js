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
const { Pipeline } = require('@adobe/helix-pipeline/index.js');
const { log } = require('@adobe/helix-pipeline/src/defaults/default.js');

const fetch = require('@adobe/helix-pipeline/src/html/fetch-markdown.js');
const parse = require('@adobe/helix-pipeline/src/html/parse-markdown.js');
const meta = require('@adobe/helix-pipeline/src/html/get-metadata.js');
const html = require('@adobe/helix-pipeline/src/html/make-html.js');
const type = require('@adobe/helix-pipeline/src/utils/set-content-type.js');
const selectStatus = require('@adobe/helix-pipeline/src/html/set-status.js');
const smartypants = require('@adobe/helix-pipeline/src/html/smartypants');
const sections = require('@adobe/helix-pipeline/src/html/split-sections');
const { selectstrain, selecttest } = require('@adobe/helix-pipeline/src/utils/conditional-sections');
const debug = require('@adobe/helix-pipeline/src/html/output-debug.js');
const { esi, flag } = require('@adobe/helix-pipeline/src/html/flag-esi');
const key = require('@adobe/helix-pipeline/src/html/set-surrogate-key');
const production = require('@adobe/helix-pipeline/src/utils/is-production');
const dump = require('@adobe/helix-pipeline/src/utils/dump-context.js');
const validate = require('@adobe/helix-pipeline/src/utils/validate');
const { cache, uncached } = require('@adobe/helix-pipeline/src/html/shared-cache');
const embeds = require('@adobe/helix-pipeline/src/html/find-embeds');
const parseFrontmatter = require('@adobe/helix-pipeline/src/html/parse-frontmatter');
const unwrapSoleImages = require('@adobe/helix-pipeline/src/html/unwrap-sole-images');
const rewriteLinks = require('@adobe/helix-pipeline/src/html/static-asset-links');
const tovdom = require('@adobe/helix-pipeline/src/html/html-to-vdom');
const tohtml = require('@adobe/helix-pipeline/src/html/stringify-response');
const addHeaders = require('@adobe/helix-pipeline/src/html/add-headers');
const timing = require('@adobe/helix-pipeline/src/utils/timing');
const sanitize = require('@adobe/helix-pipeline/src/html/sanitize');
const removeHlxProps = require('@adobe/helix-pipeline/src/html/removeHlxProps');
const resolveRef = require('@adobe/helix-pipeline/src/utils/resolve-ref');

/* eslint newline-per-chained-call: off */

function hascontent({ content }) {
  return !(content !== undefined && content.body !== undefined);
}

function paranoid(context, action) {
  return action && action.secrets && !!action.secrets.SANITIZE_DOM;
}

const htmlpipe = (cont, context, action) => {
  action.logger = action.logger || log;
  action.logger.log('debug', 'Constructing HTML Pipeline');
  const pipe = new Pipeline(action);
  const timer = timing();
  pipe
    .every(dump.record)
    // .every(validate).when(() => !production())
    .every(timer.update)
    // .before(resolveRef).expose('resolve').when(hascontent)
    .use(fetch).expose('fetch').when(hascontent)
    .use(parse).expose('parse')
    .use(parseFrontmatter)
    // .before(embeds)
    // .before(smartypants)
    .use(sections)
    .use(meta).expose('meta')
    .use(unwrapSoleImages)
    // .before(selectstrain)
    // .before(selecttest)
    .use(html).expose('html')
    // .before(sanitize).when(paranoid)
    .use(cont)
    .use(type('text/html'))
    .use(cache).when(uncached)
    .use(key)
    .use(tovdom).expose('post') // start HTML post-processing
    .use(removeHlxProps).when(() => production())
    // .after(rewriteLinks).when(production)
    .use(addHeaders)
    .use(tohtml) // end HTML post-processing
    .use(flag).expose('esi').when(esi) // flag ESI when there is ESI in the response
    .use(debug)
    .use(timer.report)
    .use(dump.report)
    .use(selectStatus);

  action.logger.log('debug', 'Running HTML pipeline');
  return pipe.run(context);
};

module.exports.pipe = htmlpipe;

---
title: Integrating API Documentation
tags: blog infinisheet
---

wise words

# Publishing

* Should be able to publish the classic way by checking the generated HTML into GitHub, then using the standard GitHub pages setup to publish. The output even includes a `.nojekyll` file so GitHub knows to use use the html as is rather than running it through Jekyll. 
* Want to avoid having to check in generated documentation. Extra manual step and clutters up repo.
* GitHub Pages uses GitHub Actions to publish. You can write your own publishing workflow using the same building blocks that GitHub Pages uses.
  * [upload-pages-artifact](https://github.com/actions/upload-pages-artifact): Creates an artifact ZIP of the directory you want to publish
  * [deploy-pages](https://github.com/actions/deploy-pages): Deploys an artifact ZIP to GitHub Pages
* I copied my NPM Publish workflow and modified it to come up with this.

```yaml
name: Docs

on:
  workflow_dispatch:
  workflow_run:
    workflows: [Build CI]
    types: [completed]

jobs:
  build:
    if: |
        github.event_name == 'workflow_dispatch' ||
        ( github.event.workflow_run.conclusion == 'success' &&
          github.event.workflow_run.event == 'push' &&
          github.event.workflow_run.head_branch == 'main' &&
          contains(github.event.workflow_run.head_commit.message, 'chore(release)'))
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.X
          registry-url: https://registry.npmjs.org/
      - run: npm ci
      - run: npx typedoc
      - uses: actions/upload-pages-artifact@v3
        with:
          path: "temp/"

  publish:
    needs: build
    permissions:
      pages: write      # to deploy to Pages
      id-token: write   # to verify the deployment originates from an appropriate source
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

* The `deploy-pages` documentation recommends running it in a separate job, so I did. With the requirement to upload the content as an artifact, there's nothing stopping you running the two stages as separate jobs. I can see how this might be more reliable?

* Triggered a run manually. Build went find. Publish resulted in this.

```
Run actions/deploy-pages@v4
Fetching artifact metadata for "github-pages" in this workflow run
Found 1 artifact(s)
Creating Pages deployment with payload:
{
	"artifact_id": 1694669341,
	"pages_build_version": "2908bdcfcfd9eab618209be2108bc5059da34a9e",
	"oidc_token": "***"
}
Error: Creating Pages deployment failed
Error: HttpError: Not Found
    at /home/runner/work/_actions/actions/deploy-pages/v4/node_modules/@octokit/request/dist-node/index.js:124:1
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at createPagesDeployment (/home/runner/work/_actions/actions/deploy-pages/v4/src/internal/api-client.js:125:1)
    at Deployment.create (/home/runner/work/_actions/actions/deploy-pages/v4/src/internal/deployment.js:74:1)
    at main (/home/runner/work/_actions/actions/deploy-pages/v4/src/index.js:30:1)
Error: Error: Failed to create deployment (status: 404) with build version 2908bdcfcfd9eab618209be2108bc5059da34a9e. Request ID 2BC1:22C3E:4BBB537:8CCB6B2:66910182 Ensure GitHub Pages has been enabled: https://github.com/TheCandidStartup/infinisheet/settings/pages
```

* I'm so glad there was a meaningful error message at the end. Doh. Remember to enable GitHub Pages before trying to deploy it. Pick "GitHub Actions" as the source.

{% include candid-image.html src="/assets/images/github/pages-action-source.png" alt="GitHub Pages Settings configured to use GitHub Actions" %}

* When you first enable "GitHub Actions" as the source you will be encouraged to configure a workflow from a template. Ignore this if, like me, you've already created your own workflow. There's no extra step needed to connect GitHub pages to a specific workflow. Once enabled, any workflow can publish. Once a workflow has published, the UI changes to show the details seen here.
* When you have a pages site at the organization level with a custom domain, any project sites automatically use the same custom domain. Which is how I ended up with the Docs published to [https://thecandidstartup.org/infinisheet](https://thecandidstartup.org/infinisheet).

# Site Organization

## Adjusting TypeDoc Generated Content

* Replaced repo `README.md` with dedicated `typedoc-assets/root.md`. Let's me fix warnings because of GitHub specific links in the README. Plus tailoring content to reference documentation home page for a monorepo.
* Added custom.css to adjust tailoring to fit in with The Candid Startup.
  * First idea was to restyle the whole thing to common style
  * Really difficult to match given differences in structure
  * TypeDoc supports dynamic choice of dark or light theme which is impossible to accomodate without a complete rebuild of blog theme.
* In the end made minimal changes. 
  * Only global change is to use same font as rest of site
  * Focused on styling of top toolbar
  * Even though I *know* that Posts, Topics, etc. links are same as on blog, it doesn't feel that way. 
  * Made toolbar the same size and used same text and background color.
  * Haven't tried to exactly match the positioning of text. Very different layout scheme. One column with wide margins vs three columns.
  * Frustrating enough just trying to get vertical alignment similar.
  * Any changes in blog style will need to be reproduced in custom stylesheet. Another reason to keep changes minimal.
  * Making sure I keep track of where values came from.
  * Just enough that it feels part of the same nav structure while reinforcing that this is a separate area with different rules.
  * Can only match background color for light theme. Fortunately CS green works with dark theme too.

```css
body { 
  /* From jekyll-theme-cayman-blog.scss */
  font-family: "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif; 
  font-size: 16px; 
}

:root {
  /* From blog.scss - $background-color */
  --light-color-background-secondary: #fdfdfd;
}

.tsd-page-toolbar a {
    /* From blog.scss - $section-headings-color */
  color: #159957;
}

.tsd-page-toolbar {
  /* From blog/_layout.scss - .site-header{  min-height: $spacing-unit * 1.865; } 
   *      blog.scss - $spacing-unit: 30px
   */
  height: 55.95px;
}

.tsd-page-toolbar .tsd-toolbar-contents {
  /* Only way I could find to center links in enlarged title bar. The toolbar
   * content is given a height of 2.5rem in the TypeDoc stylesheet.
   */
  padding-top: calc((55.95px - 2.5rem)/2);
}

.container-main {
  /* Copied from TypeDoc style.css and adjusted to account for larger header
   * min-height = viewportHeight - HeaderHeight - FooterHeight - Margin
   * Changed HeaderHeight from 41px to 57px (base height + 1 for the border)
   */
  min-height: calc(100vh - 57px - 56px - 4rem);
}
```

## TypeDoc Extras Plugin

* Custom Title
* Favicon
* More Footer Stuff

```
npm install --save-dev typedoc-plugin-extras

added 1 package, and audited 1029 packages in 2s
```

Used to change title string displayed on left side of header to match the rest of the site. Also lets me add the CS favicon.

```json
{
  "plugin": [ "typedoc-plugin-extras" ],
  "customTitle": "The Candid Startup",
  "favicon": "./typedoc-assets/favicon.ico",
  "titleLink": "https://thecandidstartup.org",
  "footerTypedocVersion": true
}
```

The rest of the plugin is focused on adding more information to the footer. I added the TypeDoc version (why not?). The other options add additional lines to the footer, increasing the size, which then breaks the layout. Main content is too big which results in a scroll bar being added to the page. Same thing happens with base TypeDoc option that adds arbitrary text to the footer. 

Not useful enough to lose page space to the footer. Certainly not worth fiddling with the custom stylesheet again

## TypeDoc Coverage Plugin

```
% npm install -D typedoc-plugin-coverage

added 1 package, and audited 1030 packages in 1s
```

* Slightly annoying that referencing the badge triggers a warning because target is copied into the output directory by the plugin after links are validated. 
* Badge doesn't resize so I can't use "Docs Coverage" or similar as label. Short strings like "Docs" look weird too. In the end stuck with the default "Document" as it neatly fits the badge.
* Got to love a badge to drive behavior. Initial badge showed coverage at 52%. So naturally I immediately had to get to 100%.
* Can use `typedoc --logLevel Verbose | grep "not considered"` to list all API items that are considered undocumented. Also lists each item that it does consider documented, hence the `grep`.

## Adding Projects to the Organizational Structure

* Initial idea was to add "Projects" as a new top level concept. Then create an "Infinisheet" project page which I can use as a landing page to link to GitHub, Documentation, etc.
* Would be nice to include a list of a few key blogs related to the project
* Which meant I needed some way of tagging the blogs by project
* At which point I realized that I was reinventing "Topics" for the subset of topics that relate to a project
* Decided to start by adding an "InfiniSheet" topic and adding whatever I needed to make it into a landing page
* Tried a few ways of doing it but nothing seemed quite right. Including links in the topic description is too wordy. Hard to pick the links out and hard to understand the navigation structure. 
* Tried adding a special section with a table of links. Looked too contrived.
* Then I realized. I have a dedicated area for navigation controls in the page header that topics don't use. 

## Topic Navigation

* Fortunately, I've structured the blog to make it easy to add custom navigation controls. Each type of page has a layout. You can add custom front matter that specifies additional content to include in the page header. This is used by the "post" layout to include previous and next post buttons, together with buttons for each topic the post was tagged with.

I updated the "topic" layout to pull in its own custom navigation controls. 

```yaml
---
layout: default
include_header: topic-nav.html
---
```

The navigation controls use custom front matter in each topic to add buttons for parent and related topics, together with buttons for common external links like GitHub, NPM and Documentation. 

{% raw %}

```html
<div class="candid-header-nav">
{% if page.up %}
  {% assign topic-page = site.topics | where: "topic", page.up | first %}
  <a class="candid-header-link" href="{{ topic-page.url | absolute_url }}">&uArr; {{ topic-page.title | escape }}</a>
{% endif %}
{% if page.github %}
  <a class="candid-header-link candid-header-external" href="{{ page.github }}">GitHub</a>
{% endif %}
{% if page.npm %}
  <a class="candid-header-link candid-header-external" href="{{ page.npm }}">NPM</a>
{% endif %}
{% if page.docs %}
  <a class="candid-header-link candid-header-external" href="{{ page.docs | absolute_url }}">Documentation</a>
{% endif %}
{% for tag in page.also %}
  {% assign topic-page = site.topics | where: "topic", tag | first %}
  {% if topic-page %}
    <a class="candid-header-link" href="{{ topic-page.url | absolute_url }}" title="{{ topic-page.title }}">{{ topic-page.title | escape }}</a>
  {% endif %}
{% endfor %}
</div>
```

{% endraw %}

Here's the front matter for the [InfiniSheet]({% link _topics/infinisheet.md %}) topic.

```yaml
---
layout: topic
title: InfiniSheet
topic: infinisheet
tagline: All about the "infinisheet" monorepo
up: spreadsheets
github: https://github.com/TheCandidStartup/infinisheet
docs: /infinisheet
also: [react-virtual-scroll]
---
```

And here's what the resulting page header looks like

{% include candid-image.html src="/assets/images/infinisheet/infinisheet-topic.png" alt="InfiniSheet topic navgiation" %}
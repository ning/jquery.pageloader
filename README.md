# `jquery.pageloader`

[`jquery.pageloader`](jquery.pageloader.js) is a jQuery plug-in which
implements Ajax loading of multiple content pages into the DOM,
and offers a variety of page transitions to move from page to page.
Pages may be flipped programmatically, or using touch or mouse swipe gestures.
Browser history is supported using HTML5 `popstate` events.

`jquery.pageloader` is designed for use in a mobile or tablet webapp to
provide a native-like page-flipping experience.

## Invocation

`jquery.pageloader` is invoked as a jquery plugin as follows:

    $('#pageloader').pageloader( [{ options }] );

## Options

The following options are available:

+ `transition` -- The transition effect to use: `slide`, `flip`,
  `fade`, `reveal`, `spin`, or `none`. Default: `slide`.
+ `duration` -- Number of milliseconds for each page transition.
   Default: `300`.
+ `enableSwiping` -- Whether to respond to swipe gestures. Default: `true`.
+ `enableMouseSwiping` -- Whether to respond to swipe gestures based on
   mouse evvents (in addition to touch events).  Default: `true`.
+ `urlPrefix`, `urlSuffix` -- Used to map page names into URLs for ajax
  endpoints. This will depend on your server platform. Default: blank.
+ `idPrefix` -- Used to generate unique element IDs from page names.
   Default: `pageloaded-`
+ `swipeMinOffset` -- Number of pixels a gesture must travel before
   qualifying to be a swipe.  Default: `5`
+ `swipeMaxSlope` -- Maximum slope (from horizontal) which a swipe gesture
   may travel before being disqualified as a swipe. Default: `0.2`.

## Methods

Once initialized, a pageloader will respond to a number of method
calls of the form

    $('#pageloader').pageloader('method-name' [, args...] );

Available methods are:

+ `configure` -- Change the options used to configure the instance.
+ `load` -- Load a page using ajax, and transition to it.
+ `post` -- Like `load`, but use a POST method.
+ `forward` -- Transition to the next page forward.
+ `backward` -- Transition to the previous page.
+ `goto` -- Go to a page, `load` it if it does not yet exist.
+ `fetch` -- Download and install a new page into the DOM, but do not
  transition to it

See the source code for more information on these methods, including 
applicable arguments.

## Markup

`jquery.pageloader` expects to be run on a `div` with the following stucture:

    <div class="pageloader">
        <div class="_sequence">
            <!-- pages go here -->
        </div>
    </div>

(These class names are only required by the default CSS file, and can
be changed there if necessary.)

Every child element of the `_sequence` will be considered a page.  The
`_sequence` may be preloaded with zero or more pages; the first page
will be initially visible by default.  Additional pages are loaded
programmatically using the `load` method, or automatically by
`data-next` and `data-prev` links on each page element.

## CSS

The file [`jquery.pageloader.css`](jquery.pageloader.css) provides the CSS which is required
for proper functioning of the plug-in.  The pageloader and its pages
may also be styled more specifically for the particular application.

## Events

`jquery.pageloader` triggers a `ready` event on each page, once the
DOM is ready.  

## Dependencies

`jquery.pageloader` requires the `animateWithCss` method as defined
by Aza Raskin's [`jquery.css-transitions`](https://gist.github.com/435054).
A copy is provided in the `/lib` folder for the purposes of running the demo.

## Demo

A [demo](./demo) is provided in the `demo` directory.
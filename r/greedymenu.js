/**
 * Greedymenu - hides menu items that don't fit in a popup menu
 *
 * Automatically applies to to elements with MENU_CLASS or MENU_S_CLASS
 * on document load. Also exports an initialization function (window.greedymenu)
 * that can be used to transform nav lists explicitly.
 * 
 * Inspired by http://codepen.io/lukejacksonn/pen/PwmwWV/
 *
 * @author Maxwell Terpstra <telic.detour+github@gmail.com>
 */
import "./greedymenu.css!";

const MENU_CLASS   = "greedymenu";
const MENU_S_CLASS = "greedymenu--styled";
const MENU_C_CLASS = "greedymenu--collapsed";

const MTOOL_CLASS = "greedymenu__measureTool";

const BUTTON_CLASS = "greedymenu__button";
const ICON_CLASS   = "greedymenu__button__icon";

const FLYOUT_CLASS = "greedymenu__flyout";
const LIST_CLASS   = "greedymenu__original";

const PROTECT_CLASS = "greedymenu__fixed";

const RTOOL_CLASS   = "greedymenu__resizerTool";
const RTOOL_G_CLASS = "greedymenu__resizerTool__grow";
const RTOOL_S_CLASS = "greedymenu__resizerTool__shrink";

const FLYOUT_SIZE_DATA = "data-greedymenu-hidden";
const ITEM_WIDTH_DATA  = "data-greedymenu-width";
const ITEM_INDEX_DATA  = "data-greedymenu-index";

// hamburger icon.
//	<svg class="greedymenu__buton__icon" viewbox="0 0 6 6">
//		<line y1="1" y2="1" x1="0" x2="6" />
//		<line y1="3" y2="3" x1="0" x2="6" />
//		<line y1="5" y2="5" x1="0" x2="6" />
//	</svg>
const SVG = "http://www.w3.org/2000/svg";
const hamburger = createNS(SVG, "svg", {
	'class': ICON_CLASS,
	'viewBox': "0 0 6 6"
});
for (const i of [1,3,5]) {
	hamburger.appendChild(
		createNS(SVG, "line", { 'y1': i, 'y2': i, 'x1': 0, 'x2': 6 })
	);
}

// predictable element to do width calculations
const measureTool = create("div", { 'class': MTOOL_CLASS });

// resize detector
const resizerClass = { 'class': RTOOL_CLASS };
const resizerTool = create("div", resizerClass, [
	create("div", resizerClass, [
		create("div", { 'class': RTOOL_G_CLASS })
	]),
	create("div", resizerClass, [
		create("div", { 'class': RTOOL_S_CLASS })
	])
]);

// automatically initalize menus on DOM load
if (document.readyState === "complete") {
	autoInit();
} else {
	document.addEventListener("DOMContentLoaded", autoInit);
}
function autoInit() {
	document.querySelectorAll("nav."+MENU_CLASS+", nav."+MENU_S_CLASS)
		.forEach(init);
}

let inst = 0; // instance counter; for generating IDs
export default function init(nav) {
	// find the first list child
	const oList = (function() {
		for (let l of Array.from(nav.children)) {
			if (l.matches("ul,ol")) {
				return l;
			}
		}
	})();
	if (oList === undefined) return;
	// make sure nav has a root class
	if (!nav.classList.contains(MENU_CLASS)) {
		nav.classList.add(MENU_CLASS);
	}
	// mark it as the original
	oList.classList.add(LIST_CLASS);
	// add the flyout menu and button
	const flyout = create(oList.nodeName, {
		'id': FLYOUT_CLASS+":"+(inst++),
		'class': FLYOUT_CLASS,
		'aria-role': "menu",
		'aria-hidden': true,
	});
	nav.appendChild(flyout);
	const button = create("button", {
		'class': BUTTON_CLASS,
		'type': "button",
		'aria-haspopup': true,
		'aria-controls': flyout.id,
		'aria-expanded': false,
		'aria-hidden': true,
	});
	button.appendChild(hamburger.cloneNode(true));
	nav.appendChild(button);
	// wire the button to toggle the flyout menu
	button.addEventListener('click', function() {
		let expanded = (button.getAttribute('aria-expanded') === "true");
		flyout.setAttribute('aria-hidden', expanded);
		button.setAttribute('aria-expanded', !expanded);
		if (expanded) button.focus();
		else flyout.querySelector("li > *").focus();
	});
	// escape key should also close the flyout
	window.addEventListener('keyup', function(e) {
		if (e.keyCode === 27) {
			// send focus to the button if it is currently inside the flyout
			let focus = document.activeElement;
			while (focus.parentNode) {
				if (focus === flyout) {
					button.focus();
					break;
				}
				focus = focus.parentNode;
			}
			// then close the flyout			
			flyout.setAttribute('aria-hidden', true);
			button.setAttribute('aria-expanded', false);
		}
	});
	// hide any items that don't fit
	reflow(nav, oList, flyout, button);
	// reflow again whenever nav size changes
	subscribe(nav, oList, flyout, button);
}

function subscribe(nav, oList, flyout, button) {
	const sensor = resizerTool.cloneNode(true);
	const grow = sensor.childNodes[0];
	const shrink = sensor.childNodes[1];
	let oldWidth = nav.offsetWidth;
	let newWidth;
	let widthChanged = false;
	let rafWaiting = false;
	const onScroll = function() {
		newWidth = nav.offsetWidth;
		widthChanged = (newWidth !== oldWidth);
		if (widthChanged && !rafWaiting) {
			rafWaiting = true;
			requestAnimationFrame(function() {
				rafWaiting = false;
				if (!widthChanged) return;
				oldWidth = newWidth;
				reflow(nav, oList, flyout, button);
			});
		}
		grow.scrollLeft = 100000;
		shrink.scrollLeft = 100000;
	};
	nav.appendChild(sensor);
	grow.scrollLeft = 100000;
	shrink.scrollLeft = 100000;
	grow.addEventListener('scroll', onScroll);
	shrink.addEventListener('scroll', onScroll);
}

function reflow(nav, oList, flyout, button) {
	const n = getComputedStyle(nav);
	const pl = convertToUnitlessPx(n.getPropertyValue('padding-left'));
	const pr = convertToUnitlessPx(n.getPropertyValue('padding-right'));
	const available = nav.clientWidth - pl - pr;

	let actual;
	if (flyout.children.length > 0) {
		actual = parseFloat(flyout.getAttribute(ITEM_WIDTH_DATA));
	} else {
		const u = getComputedStyle(oList);
		const ml = convertToUnitlessPx(u.getPropertyValue('margin-left'));
		const mr = convertToUnitlessPx(u.getPropertyValue('margin-right'));
		actual = oList.offsetWidth + ml + mr;
	}

	if (actual > available) {
		let items = oList.children;
		// show the flyout menu toggle button if we haven't already
		if (button.getAttribute('aria-hidden') === "true") {
			button.setAttribute('aria-hidden', false);
			button.style.right = n.getPropertyValue('padding-right');
			oList.style.setProperty("padding-right", button.offsetWidth+"px", "important");
			actual += button.offsetWidth;
			// also mark the nav, to help with styling
			nav.classList.add(MENU_C_CLASS);
			// and remember actual required width
			flyout.setAttribute(ITEM_WIDTH_DATA, actual);
		}
		// move everything into the flyout
		for (let i=items.length-1; i>=0; i--) {
			if (!items[i].classList.contains(PROTECT_CLASS)) {
				// remember where this item came from
				items[i].setAttribute(ITEM_INDEX_DATA, i);
				// and move it to the flyout menu
				flyout.insertBefore(items[i], flyout.firstChild);
			}
		}
	}
	else if (available >= actual) {
		let items = flyout.children;
		// add items back to the original list as long as there is room
		while (items.length>0) {
			oList.insertBefore(
				items[0],
				oList.children[
					parseInt(items[0].getAttribute(ITEM_INDEX_DATA))
				]
			);
		}
		// remove the button if nothing left in the flyout
		button.setAttribute('aria-hidden', true);
		oList.style.paddingRight = 0;
		nav.classList.remove(MENU_C_CLASS);
	}
	// track the flyout menu size on a button data attr
	button.setAttribute(FLYOUT_SIZE_DATA, flyout.children.length);
}


// ######################
// ### UTILITY FUNCTIONS
// ######################

function convertToUnitlessPx(val) {
	if (/^\s*[-+]?\d+(\.\d+)?(px)?\s*$/.test(val)) {
		return parseInt(val);
	} else {
		if (measureTool.parentNode === null) {
			document.body.appendChild(measureTool);
		}
		measureTool.style.width = val;
		return measureTool.offsetWidth;
	}
}

function createNS(ns, tag, attrMap, children) {
	return create(
		document.createElementNS(ns, tag),
		attrMap,
		children
	);
}
function create(tag, attrMap, children) {
	let n = (tag instanceof Node) ? tag : document.createElement(tag);
	for (let a in attrMap) {
		n.setAttribute(a, attrMap[a]);
	}
	if (children) for (let c of children) {
		n.appendChild(c);
	}
	return n;
}

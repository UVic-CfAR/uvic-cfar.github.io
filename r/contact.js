/* eslint-env es6 */
"use strict";

const FORM_SEL = "._contactform";
const SUCCESS_SEL = "._contactform__success";
const FAIL_SEL = "._contactform__fail";

document.querySelector(FORM_SEL).addEventListener('submit', function(e) {
	let form = this;
	e.preventDefault();
	// send the form by ajax
	let ajax = new XMLHttpRequest();
	ajax.open(form.getAttribute('method'), form.getAttribute('action'));
	ajax.setRequestHeader('Accept', 'application/json');
	ajax.onreadystatechange = function() {
		if (ajax.readyState === XMLHttpRequest.DONE) {
			if (ajax.status === 200) {
				// success!
				// temporarily show the thank-you notice
				let alert = document.querySelector(SUCCESS_SEL);
				alert.setAttribute('aria-hidden', false);
				setTimeout(()=>alert.setAttribute('aria-hidden', true), 5000);
				// reset the form
				form.reset();
			} else {
				// show an error
				document.querySelector(FAIL_SEL).setAttribute('aria-hidden', false);
			}
			// regardless, re-enable the form
			form.querySelectorAll("[name]")
				.forEach((i)=>i.disabled=false);
			form.querySelector("[name='send']").textContent = "Send";
		}
	};
	ajax.send(new FormData(form));
	// hide any success/error messages still visible
	document.querySelectorAll(SUCCESS_SEL+","+FAIL_SEL)
		.forEach((i)=>i.setAttribute('aria-hidden', true));
	// disable the form to prevent re-submits
	form.querySelectorAll("[name]")
		.forEach((i)=>i.disabled = true);
	// change button text to show we're loading
	form.querySelector("[name='send']").textContent = "Sending …";
});

document.addEventListener('keyup', function(e) {
	if (e.keyCode === 27) {
		document.querySelectorAll(FAIL_SEL+","+SUCCESS_SEL)
			.forEach((i)=>i.setAttribute('aria-hidden', true));
	}
});

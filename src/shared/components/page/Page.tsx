import * as React from 'react';
import './Page.scss';
import classNames from 'classnames';
import { useContext, useEffect } from 'react';
import { FrameworkContext } from '../frameworkSettings/FrameworkSettings';
import { Router } from '../../navigation';
import { Box } from '../box/Box';

export interface PageProps {
	className?: string;
	title?: string;
	description?: string;
	// Open Graph
	opg?: {
		title: string;
		type: 'website' | 'article' | string;
		image: string;
		url: string;
		[key: 'description' | 'audio' | 'video' | string]: string;
	};
	structuredDataJsonLd?: Object | string;
	children?: React.ReactNode;
}

const Page: React.FC<PageProps> = (props) => {
	const frameworkSettings = useContext(FrameworkContext);

	useEffect(() => {
		const globalRouterInstance = Router.getInstance();
		document.title = props.title || globalRouterInstance.initialSiteTitle;
	}, [props.title]);

	useEffect(() => {
		const globalRouterInstance = Router.getInstance();
		const newDescription = props.description || globalRouterInstance.initialSiteDescription;

		const metaTags = document.getElementsByTagName('meta');
		for (let i = 0; i < metaTags.length; i++) {
			if (!metaTags[i].getAttributeNames().includes('name')) continue;
			if (metaTags[i].getAttribute('name') !== 'description') continue;

			metaTags[i].setAttribute('content', newDescription);
			return;
		}

		// If we got here there was no meta tag found with description
		const meta = document.createElement('meta');
		meta.name = 'description';
		meta.content = newDescription;
		document.getElementsByTagName('head')[0].appendChild(meta);
	}, [props.description]);

	useEffect(() => {
		// First go through and delete structured data json ld
		const scriptTags = document.getElementsByTagName('script');
		const scriptToRemove: HTMLScriptElement[] = [];
		for (let i = 0; i < scriptTags.length; i++) {
			if (!scriptTags[i].getAttributeNames().includes('type')) continue;
			if (scriptTags[i].getAttribute('type') !== 'application/ld+json') continue;

			scriptToRemove.push(scriptTags[i]);
		}
		const head = document.getElementsByTagName('head')[0];
		scriptToRemove.forEach((script) => {
			head.removeChild(script);
		});

		if (!props.structuredDataJsonLd && !frameworkSettings.structuredDataJsonLd) return;

		// If we got here there was no meta tag found with description
		const script = document.createElement('script');

		script.type = 'application/ld+json';
		let structuredDataJsonLd = props.structuredDataJsonLd || frameworkSettings.structuredDataJsonLd;
		script.innerHTML =
			typeof structuredDataJsonLd === 'string' ? structuredDataJsonLd : JSON.stringify(structuredDataJsonLd);
		document.getElementsByTagName('head')[0].appendChild(script);
	}, [props.structuredDataJsonLd, frameworkSettings.structuredDataJsonLd]);

	useEffect(() => {
		// First go through and delete all Open Graph tags
		const metaToRemove: HTMLMetaElement[] = [];
		const metaTags = document.getElementsByTagName('meta');
		for (let i = 0; i < metaTags.length; i++) {
			if (!metaTags[i].getAttributeNames().includes('property')) continue;
			if (!metaTags[i].getAttribute('property')!.includes('og:')) continue;

			metaToRemove.push(metaTags[i]);
		}
		const head = document.getElementsByTagName('head')[0];
		metaToRemove.forEach((meta) => {
			head.removeChild(meta);
		});

		function appendOgMetaTag(property: string, content: string) {
			const meta = document.createElement('meta');
			meta.setAttribute('property', property);
			meta.content = content;
			document.getElementsByTagName('head')[0].appendChild(meta);
		}

		let opg = props.opg || frameworkSettings.opg;
		if (!opg) return;

		appendOgMetaTag('og:title', opg.title);
		appendOgMetaTag('og:type', opg.type);
		appendOgMetaTag('og:image', opg.image);
		appendOgMetaTag('og:url', opg.url);

		// Add any properties that are not in the default list
		for (const key in opg) {
			if (key === 'title' || key === 'type' || key === 'image' || key === 'url') continue;
			appendOgMetaTag(`og:${key}`, opg[key]);
		}
	}, [props.opg, frameworkSettings.opg]);

	return <Box className={classNames('htPage', props.className)}>{props.children}</Box>;
};

export { Page };

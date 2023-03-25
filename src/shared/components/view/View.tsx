import React, { Component, createRef } from 'react';
import './View.scss';
import events from '../../navigation/events';

export interface ViewProps {
	id: string;
	initialPath: string;
	default?: boolean;
}

interface ViewState {
	currentPage: React.ReactNode | null;
	transitionToPage: React.ReactNode | null;
	transitioning: boolean;
	navigatingBack: boolean;
	path: string;
}

export class View extends Component<ViewProps, ViewState> {
	constructor(props: ViewProps) {
		super(props);
		this.state = {
			currentPage: null,
			transitionToPage: null,
			transitioning: false,
			navigatingBack: false,
			path: props.initialPath
		};
	}

	viewElement = createRef<HTMLDivElement>();

	componentDidMount() {
		events.dispatch('addView', { id: this.props.id, default: !!this.props.default, instance: this });
	}

	componentWillUnmount() {
		events.dispatch('removeView', { id: this.props.id });
	}

	getPath() {
		return this.state.path;
	}

	getInitialPath() {
		return this.props.initialPath;
	}

	getCurrentPageData() {
		return this.state.currentPage;
	}

	isDefault() {
		return !!this.props.default;
	}

	/**
	 * Sets a page to be rendered. This will animate out the current page and transition in a new page.
	 * @param page - Page to be shown in the current view
	 * @param path - Path including any query parameters
	 */
	setPage(page: React.ReactNode, path: string) {
		return new Promise<void>((resolve) => {
			// let transitionPageData = { page, props };
			this.setState({ currentPage: page, path }, resolve);
			// setTimeout(() => {
			// 	let finalPage = this.state.transitionPageData;
			// 	this.setState({  currentPageData: finalPage, transitionPageData : null, navigatingBack: false }, resolve);
			// }, 350); // The timeout should be based on the animation or zero if there is no animation
		});
	}

	back(page: React.ReactNode, path: string) {
		this.setState({ navigatingBack: true });
		return this.setPage(page, path);
	}

	renderPages() {
		let toRender = [];
		if (this.state.transitionToPage && this.state.navigatingBack) {
			let Pg = this.state.transitionToPage;
			// @ts-ignore
			toRender.push(<Pg key="backPage" />);
		}

		if (this.state.currentPage) {
			let Pg = this.state.currentPage;
			// @ts-ignore
			toRender.push(<Pg key="page" />);
		}

		if (this.state.transitionToPage && !this.state.navigatingBack) {
			let Pg = this.state.transitionToPage;
			// @ts-ignore
			toRender.push(<Pg key="forwardPage" />);
		}

		return toRender;
	}

	render() {
		return (
			<div id={this.props.id} className="htView" ref={this.viewElement}>
				{this.renderPages()}
			</div>
		);
	}
}

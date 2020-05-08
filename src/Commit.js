import React from 'react'
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Accordion from 'react-bootstrap/Accordion';
import { useAccordionToggle } from 'react-bootstrap/AccordionToggle';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import CommitMessage from './CommitMessage';
import Statuses from './Statuses';
import StatusBadgeVariantMap from './StatusBadgeVariantMap';
import { CaretDown, CaretRight } from 'react-bootstrap-icons';

class Commit extends React.Component {
  state = {
    summary: {
      completed: 0,
      failed: 0,
      exception: 0,
      running: 0,
      pending: 0,
      unscheduled: 0
    },
    contexts: [],
    statuses: [],
    expanded: false
  };

  constructor(props) {
    super(props);
    this.appendToSummary = this.appendToSummary.bind(this);
  }

  appendToSummary(summary) {
    this.setState(state => ({
      summary: {
        completed: state.summary.completed + summary.completed,
        failed: state.summary.failed + summary.failed,
        exception: state.summary.exception + summary.exception,
        running: state.summary.running + summary.running,
        pending: state.summary.pending + summary.pending,
        unscheduled: state.summary.unscheduled + summary.unscheduled
      }
    }));
  }

  /*
  note: to run locally, a cors proxy is required.

  to install a local cors proxy:
  $ sudo npm install -g local-cors-proxy

  to run a local cors proxy with authenticated github requests:
  $ lcp --proxyUrl https://grenade:$(pass github/grenade/token/cloud-image-builder)@api.github.com
  */

  componentDidMount() {
    this.setState(state => ({ expanded: this.props.expand }));
    fetch(
      (window.location.hostname === 'localhost')
        ? 'http://localhost:8010/proxy/repos/mozilla-platform-ops/cloud-image-builder/commits/' + this.props.commit.sha + '/statuses'
        : 'https://grenade-cors-proxy.herokuapp.com/https://api.github.com/repos/mozilla-platform-ops/cloud-image-builder/commits/' + this.props.commit.sha + '/statuses'
    )
    .then(responseGithubApiStatuses => responseGithubApiStatuses.json())
    .then((githubCommitStatuses) => {
      if (githubCommitStatuses.length) {
        this.setState(state => ({
          contexts: [...new Set(githubCommitStatuses.map(s => s.context))].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
          statuses: githubCommitStatuses//.filter(s => s.state !== 'pending')
        }));
      }
    })
    .catch(console.log);
  }

  render() {
    return (
      <Card style={{ width: '100%', marginTop: '10px' }}>
        <Card.Header>
          <Accordion.Toggle as={Button} variant="link" eventKey={this.props.commit.sha} onClick={() => {
            this.setState(state => ({expanded: !state.expanded}))
          }}>
            {(this.state.expanded) ? <CaretDown /> : <CaretRight />}
          </Accordion.Toggle>
          {
            new Intl.DateTimeFormat('en-GB', {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
              hour: 'numeric',
              minute: 'numeric',
              timeZoneName: 'short'
            }).format(new Date(this.props.commit.committer.date))
          }
          &nbsp;
          <a href={this.props.commit.url}>
            { this.props.commit.sha.substring(0, 7) }
          </a>
          {
            Object.keys(this.state.summary).filter(k => this.state.summary[k] > 0).map(k => (
              <Badge
                style={{ marginLeft: '0.3em' }}
                variant={StatusBadgeVariantMap[k]}>
                {this.state.summary[k]}
              </Badge>
            ))
          }
          <Image
            src={this.props.commit.author.avatar}
            alt={this.props.commit.author.name}
            title={this.props.commit.author.name}
            rounded={true}
            style={{ width: '30px', height: '30px', marginLeft: '10px' }}
            className="float-right" />
          <span className="float-right">
            { this.props.commit.author.username }
          </span>
        </Card.Header>
        <Accordion.Collapse eventKey={this.props.commit.sha}>
          <Card.Body>
            <CommitMessage message={this.props.commit.message} />
            <Statuses contexts={this.state.contexts} statuses={this.state.statuses} appender={this.appendToSummary} />
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    );
  }
}

export default Commit;

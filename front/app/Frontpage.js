import React from 'react'
import { Redirect } from 'react-router-dom'
import './Frontpage.css'

const api = 'http://localhost:3000/api'

class Frontpage extends React.Component {
    state = {
        sites: undefined,
        input: '',
        siteFreeIndicatorColor: '#D8E6F3',
        errorMsg: '',
        redirect: false
    }

    async componentDidMount() {
        // console.log('Frontpage.componentDidMount')
        const fetchResult = await fetch('http://localhost:3000/api')
        if (fetchResult.status !== 200) {
            this.setState({ errorMsg: 'Error fetching site information from the database'})
            return console.error('Error fetching the list of sites', fetchResult)
        }
        const sites = await fetchResult.json()
        this.setState({ sites })
    }

    handleInput = (event) => {
        const input = event.target.value
        let siteFreeIndicatorColor
        if (input.length < 3) {
            siteFreeIndicatorColor = '#D8E6F3'
        } else if (this.state.sites.includes(input)) {
            siteFreeIndicatorColor = 'red'
        } else {
            siteFreeIndicatorColor = 'green'
        }
        this.setState({ input, siteFreeIndicatorColor })
    }

    enter = (event) => {
        event.preventDefault()
        this.setState({ redirect: true })
    }

    ErrorPage = () => (
        <div className="Frontpage">
            <div className="frontpage-content">
                <h2 className="error">{this.state.errorMsg}</h2>
            </div>
        </div>
    )

    Contents = () => (
        <div className="Frontpage">
            <div className="frontpage-content">
                <h1>Welcome to Binder</h1>
                <form onSubmit={this.enter}>
                    <p>Please select a site:
                        <input type="text"
                            value={this.state.input}
                            onChange={this.handleInput}
                            autoFocus />
                        <span className="dot" style={{ backgroundColor: this.state.siteFreeIndicatorColor }}></span>
                    </p>
                </form>
            </div>
        </div>
    )

    render () {
        if (this.state.redirect) {
            return <Redirect to={'/binder/' + this.state.input} />
        }
        if (this.state.errorMsg) {
            return this.ErrorPage()
        }
        return this.Contents()
    }
}

export default Frontpage;

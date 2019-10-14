import React from 'react'
import './Frontpage.css'

const api = 'http://localhost:3000/api'

class Frontpage extends React.Component {
    state = {
        sites: undefined,
        input: '',
        siteFreeIndicatorColor: '#D8E6F3',
        errorMsg: ''
    }

    async componentDidMount() {
        console.log('Frontpage.componentDidMount')
        const fetchResult = await fetch('http://localhost:3000/api')
        if (fetchResult.status !== 200) {
            this.setState({ errorMsg: 'Error fetching site information from the database'})
            return console.error('Error fetching the list of sites', fetchResult)
        }
        const sites = await fetchResult.json()
        this.setState({ sites })
    }

    handleInput = (event) => {
        console.log('sites', this.state.sites)
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

    render () {
        if (this.state.errorMsg) {
            return (
                <div className="Frontpage">
                    <div className="frontpage-content">
                        <h2 className="error">{this.state.errorMsg}</h2>
                    </div>
                </div>
            )
        }
        return (
            <div className="Frontpage">
                <div className="frontpage-content">
                    <h1>Welcome to Binder</h1>
                    <p>Please select a site:
                        <input type="text"
                            value={this.state.input}
                            onChange={this.handleInput} />
                        <span className="dot" style={{ backgroundColor: this.state.siteFreeIndicatorColor }}></span>
                    </p>
                </div>
            </div>
        )
    }
}

export default Frontpage;

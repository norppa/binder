import React from 'react'
import Modal from 'react-modal'
import axios from 'axios'
import './Site.css'

import tree from '../tools/tree'
import Brancher from './Brancher'

const api = 'http://localhost:3000/api'

Modal.setAppElement('#app')

class Site extends React.Component {
    state = {
        auth: undefined,
        modal: false,
        incorrectPasswordMessage: false,
        passwordValue: '',
        data: undefined,
        active: undefined
    }

    async componentDidMount() {
        const site = this.props.match.params.site
        const siteExists = await this.siteExists(site)
        const token = window.sessionStorage.getItem
        if (siteExists === undefined) {
            this.setState({ modal: 'error' })
        } else if (siteExists) {
            const token = window.sessionStorage.getItem(`${site}_token`)
            if (token) {
                this.setState({ auth: token }, this.getFiles)
            } else {
                this.setState({ modal: 'login' })
            }
        } else {
            this.setState({ modal: 'create' })
        }

    }

    handlePasswordValueChange = (event) => this.setState({ passwordValue: event.target.value })
    openModal = (type) => () => this.setState({ modal: type })
    closeModal = () => this.setState({ modal: false, incorrectPasswordMessage: false })
    login = (event) => {
        event.preventDefault()
        axios.post(`${api}/${this.props.match.params.site}/login`, { password: this.state.passwordValue })
            .then(response => {
                if (response.status === 200) {
                    window.sessionStorage.setItem(this.props.match.params.site + '_token', response.data.token)
                    this.setState({ auth: response.data.token }, this.getFiles)
                    this.closeModal()
                }
            })
            .catch(error => {
                if (error.response.status === 401) {
                    this.setState({ incorrectPasswordMessage: true })
                }
            })
    }
    create = (event) => {
        event.preventDefault()
        console.log('create site', this.props.match.params.site )
        this.closeModal()
    }

    getFiles = async () => {
        const url = api + '/' + this.props.match.params.site + '/files'
        const headers = { headers: { Authorization: 'bearer ' + this.state.auth }}
        let fileList = await fetch(url, headers).then(response => response.json())
        this.setState({ data: fileList, openFilePath: undefined })

    }

    siteExists = (site) => axios.get(`${api}/${site}`)
            .then(response => response.data)
            .catch(error => console.error(error))

    createFile = async (event) => {
        console.log('data', this.state.data)
        const data = { ...this.state.data }
        const selected = tree.findSelected(data)
        console.log('selected', selected)
        const parent = selected.isFolder ? selected : this.find(selected.parent, data)
        console.log('parent', parent)
        const newFile = {
            name: 'new_file',
            contents: '',
            parent: parent.id
        }
        console.log('data2', this.state.data)

        parent.children = parent.children.concat(newFile)

    }

    updateActive = (name) => (event) => {
        const data = this.state.data.map(file => {
            if (file.id === this.state.active) {
                return { ...file, [name]: event.target.value, modified: true }
            } else {
                return file
            }
        })
        this.setState({ data })
    }

    brancherSetData = (data) => this.setState({ data })

    select = async (selected) => {
        // console.log('select', selected)
        const file = this.state.data.find(file => file.id === selected)
        if (file.isFolder) return

        if (!file.contents) {
            const url = api + '/' + this.props.match.params.site + '/files/' + selected
            const headers = {
                method: 'GET',
                headers: { Authorization: 'bearer ' + this.state.auth }
            }
            const fetchResult = await fetch(url, headers)
            if (fetchResult.status === 200) {
                const result = await fetchResult.json()
                const data = this.state.data.map(file => file.id === selected ? Object.assign({}, file, result) : file)
                this.setState({ data, active: selected })
            }
        } else {
            this.setState({ active: selected })
        }
    }

    saveChanges = async () => {


        const modifiedData = tree.flatten(this.state.data).filter(x => x.modified)
        console.log('modifiedData', modifiedData)
        if (modifiedData.length === 0) return

        const url = api + '/' + this.props.match.params.site
        const data = {
            method: 'PUT',
            headers: {
                'Authorization': 'bearer ' + this.state.auth,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(modifiedData),

        }
        const fetchResult = await fetch(url,data)
        if (fetchResult.status === 201) {
            const localFileData = { ...this.state.localFileData }
            Object.keys(localFileData).forEach(key => localFileData[key].modified = false)
            this.setState({ localFileData })
        } else {
            console.log('failure', fetchResult.status)
        }
    }



    Modals = () => (
        <div className="Modals">
            <Modal isOpen={this.state.modal === 'login'}
                contentLabel={`Please log in to ${this.props.match.params.site}`}>
                {this.state.incorrectPasswordMessage ? <div>Incorrect Password!</div> : null}
                <h2>Log in to /{this.props.match.params.site}</h2>
                <form onSubmit={this.login}>
                    <input type="password"
                        value={this.state.passwordValue}
                        onChange={this.handlePasswordValueChange} />
                </form>
            </Modal>

            <Modal isOpen={this.state.modal === 'create'}>
                <h2>Create /{this.props.match.params.site}</h2>
                <form onSubmit={this.create}>
                    <input type="password"
                        value={this.state.passwordValue}
                        onChange={this.handlePasswordValueChange} />
                </form>
            </Modal>

            <Modal isOpen={this.state.modal === 'error'}>
                <h2>There was an error!</h2>
            </Modal>
        </div>
    )

    render () {
        if (this.state.data === undefined) return <this.Modals />
        // colors #425270 60ADD0 92ADC4 D8E6F3 57394D
        const activeFile = this.state.data.find(file => file.id === this.state.active) || {name: '', contents: ''}
        return (
            <div className="Site">
                <div className="navi">
                    <div className="navi-btns">
                        <button onClick={this.saveChanges}>save</button>
                        <button onClick={this.createFile}>new file</button>
                    </div>

                    <Brancher data={this.state.data}
                        setData={this.brancherSetData}
                        onSelect={this.select} />

                    <div className="debug-info">
                        {this.state.debug}
                    </div>
                </div>
                <div>
                <input type="text" value={activeFile.name}
                    onChange={this.updateActive('name')}
                    disabled={!this.state.active} />
                <textarea value={activeFile.contents}
                    onChange={this.updateActive('contents')}
                    disabled={!this.state.active} />
                </div>

                <this.Modals />
            </div>

        )
    }
}

export default Site;

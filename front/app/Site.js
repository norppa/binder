import React from 'react'
import Modal from 'react-modal'
import axios from 'axios'
import './Site.css'

import Brancher from './Brancher'

const api = 'http://localhost:3000/api'

Modal.setAppElement('#app')

class Site extends React.Component {
    state = {
        auth: undefined,
        modal: false,
        incorrectPasswordMessage: false,
        passwordValue: '',
        brancherData:  [],
        localFileData: { null: {id: -1, name: '', contents: ''} },
        selected: null
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

        const toTreeNode = (listItem) => {
            const treeNode = {
                id: listItem.id,
                name: listItem.name
            }
            if (listItem.isFolder) {
                treeNode.children = true
            }
            return treeNode
        }

        const getChildrenOf = (parentId) => {
            const children = fileList.filter(x => x.parent === parentId).map(toTreeNode)
            fileList = fileList.filter(x => x.parent !== parentId)
            children.forEach(node => {
                if (node.children) {
                    node.children = getChildrenOf(node.id)
                }
            })
            return children
        }

        const tree = getChildrenOf(null)
        this.setState({ brancherData: tree })

    }

    siteExists = (site) => axios.get(`${api}/${site}`)
            .then(response => response.data)
            .catch(error => console.error(error))

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

    onClickDelete = async (event) => {
        console.log('onClickDelete')

    }

    onClickNewFile = async (event) => {
        console.log('onClickNewFile')
    }

    updateCurrentFile = (name) => (event) => {
        const currentFile = this.state.localFileData[this.state.selected]
        currentFile[name] = event.target.value
        currentFile.modified = true
        this.setState({ localFileData: {...this.state.localFileData, [this.state.selected]: currentFile }})
    }

    brancherSetData = (brancherData) => this.setState({ brancherData })

    select = async ({ selected }) => {
        if (!selected.children) {
            if (!this.state.localFileData[selected.id]) {
                const url = api + '/' + this.props.match.params.site + '/files/' + selected.id
                const headers = {
                    method: 'GET',
                    headers: { Authorization: 'bearer ' + this.state.auth }
                }
                const fetchResult = await fetch(url, headers)
                if (fetchResult.status === 200) {
                    const body = await fetchResult.json()

                    const file = {
                        id: selected.id,
                        name: body.name,
                        contents: body.contents,
                        modified: false
                    }
                    this.setState({ localFileData: {...this.state.localFileData, [selected.id]: file}})
                }
            }
            this.setState({ selected: selected.id })
        }
    }

    saveChanges = async () => {
        const changes = Object.values(this.state.localFileData).filter(x => x.modified)
        if (changes.length === 0) return undefined

        const url = api + '/' + this.props.match.params.site
        const data = {
            method: 'PUT',
            headers: {
                'Authorization': 'bearer ' + this.state.auth,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(changes),

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

    render () {
        // colors #425270 60ADD0 92ADC4 D8E6F3 57394D
        return (
            <div className="Site">
                <div className="navi">
                    <div className="navi-btns">
                        <button onClick={this.saveChanges}>save</button>
                    </div>

                    <Brancher data={this.state.brancherData}
                        setData={this.brancherSetData}
                        onSelect={this.select} />

                    <div className="debug-info">
                        {this.state.debug}
                    </div>
                </div>
                <div>
                <input type="text" value={this.state.localFileData[this.state.selected].name}
                    onChange={this.updateCurrentFile('name')}/>
                <textarea value={this.state.localFileData[this.state.selected].contents}
                    onChange={this.updateCurrentFile('contents')}/>
                </div>

                <this.Modals />
            </div>

        )
    }
}

export default Site;

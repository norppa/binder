import React from 'react'
import './Brancher.css'
import { FaSave } from 'react-icons/fa'
import { TiFolder, TiFolderOpen, TiDocumentText, TiEdit, TiDelete, TiDocumentAdd, TiFolderAdd, TiUpload } from 'react-icons/ti'



class Brancher extends React.Component {
    state = {
        nameEditorOpen: undefined,
        nameEditorValue: ''
    }

    Node = ({data, id, controls}) => {
        const file = data.find(file => file.id === id)
        if (file.removed) return null
        const children = data.filter(file => file.parent === id)

        const Icon = (file.isFolder ? (file.expanded ? TiFolderOpen : TiFolder) : TiDocumentText)
        const classNames = 'name' + (file.selected ? ' selected' : '')

        return (
            <div className="brancher-node">
                <div className={classNames}>
                    <div className="name-left" onClick={controls.select(file)}>
                        <Icon size={36} className="icon" />
                        {
                            this.state.nameEditorOpen === file.id
                            ? <form onSubmit={controls.changeName}>
                                <input type="text"
                                    className="name-input"
                                    value={this.state.nameEditorValue}
                                    onChange={controls.nameEditorValueChange}
                                    onBlur={controls.closeNameEditor}
                                    autoFocus />
                            </form>
                            : file.name
                        }
                    </div>
                    { file.selected ?
                    <div className="name-right">
                        <TiEdit className="action-icon" onClick={controls.edit(file)} />
                        <TiDelete className="action-icon" onClick={controls.delete(file)} />
                    </div>
                    : null }


                </div>
                { file.expanded ?
                <div className="brancher-node-children">
                    {children.map(file => <this.Node key={file.id} data={data} id={file.id} controls={controls} />)}
                </div>
                : null}
            </div>
            )
    }

    controls = {
        select: ({id, isFolder}) => () => {
            const data = this.props.data.map(file => {
                if (file.isFolder) {
                    if (file.id === id) {
                        return { ...file, selected: true, expanded: !file.expanded }
                    } else {
                        return { ...file, selected: false }
                    }
                } else {
                    if (file.id === id) {
                        return { ...file, selected: true, active: isFolder ? file.active : true }
                    } else {
                        return { ...file, selected: false, active: isFolder ? file.active : false }
                    }
                }
            })
            this.props.setData(data)
            this.props.onSelect(id)
        },
        edit: ({id, name}) => () => {
            // console.log('edit', id)
            this.setState({ nameEditorOpen: id, nameEditorValue: name })
        },
        delete: ({id}) => () => {
            // console.log('delete', id)
            let remove = [id]
            let data = this.props.data
            while (remove.length > 0) {
                const children = data.filter(file => remove.includes(file.parent))
                console.log('children to be removed', children)
                data = data
                    // remove files created since the last save
                    .filter(file => {
                        if (file.created && remove.includes.file(id)) {
                            return false
                        } else {
                            return true
                        }
                    })
                    // mark files to be removed in the next save
                    .map(file => {
                        return remove.includes(file.id) ? { ...file, removed: true, active: false, selected: false } : file
                    })
                remove = children
            }
            console.log(data)
            this.props.setData(data)
        },
        createFile: () => {
            const selected = this.props.data.find(file => file.selected)
            const parent = selected ? (selected.isFolder ? selected.id : selected.parent) : null
            const largestNewFile = this.props.data.filter(file => /new_file_\d/.test(file.name))
                                                .map(file => parseInt(file.name.replace('new_file_', '')))
                                                .reduce((acc, cur) => acc > cur ? acc : cur, 0)

            const newFile = {
                id: this.props.data.reduce((acc, cur) => Math.max(cur.id, acc), 1) + 1,
                name: 'new_file_' + (largestNewFile + 1),
                contents: '',
                parent,
                created: true,
                selected: true,
                active: true
            }
            const data = this.props.data.map(file => {
                if (file.id === parent) return {...file, selected: false, expanded: true}
                if (file.isFolder) return { ...file, selected: false }
                return { ...file, selected: false, active: false}
            }).concat(newFile)
            this.props.setData(data)
        },
        createFolder: () => {
            const selected = this.props.data.find(file => file.selected)
            const parent = selected ? (selected.isFolder ? selected.id : selected.parent) : null
            const largestNewFolder = this.props.data.filter(file => /new_folder_\d/.test(file.name))
                                                .map(file => parseInt(file.name.replace('new_folder_', '')))
                                                .reduce((acc, cur) => acc > cur ? acc : cur, 0)
            const newFolder = {
                id: this.props.data.reduce((acc, cur) => Math.max(cur.id, acc), 1) + 1,
                name: 'new_folder_' + (largestNewFolder + 1),
                isFolder: true,
                parent,
                created: true,
                selected: true,
                expanded: true
            }
            const data = this.props.data.map(file => {
                if (file.id === parent) {
                    return { ...file, selected: false, expanded: true }
                }
                return { ...file, selected: false }
            }).concat(newFolder)
            this.props.setData(data)
        },
        nameEditorValueChange: (event) => this.setState({ nameEditorValue: event.target.value }),
        closeNameEditor: (event) => this.setState({ nameEditorOpen: false }),
        changeName: (event) => {
            event.preventDefault()
            const data = this.props.data.map(file => {
                if (file.id === this.state.nameEditorOpen && this.state.nameEditorValue !== file.name) {
                    return { ...file, name: this.state.nameEditorValue, modified: true }
                } else {
                    return file
                }
            })
            this.props.setData(data)
            this.setState({ nameEditorOpen: null, nameEditorValue: undefined })
        }
    }


    render () {
        const rootFiles = this.props.data.filter(x => x.parent === null)

        return (
            <div className="Brancher">
                <div className="brancher-actions">
                    <TiDocumentAdd size={36}
                        className="icon"
                        onClick={this.controls.createFile} />
                    <TiFolderAdd size={36}
                        className="icon"
                        onClick={this.controls.createFolder} />
                </div>
                { rootFiles.map(file => <this.Node key={file.id} data={this.props.data} id={file.id} controls={this.controls} />) }
            </div>
        )
    }
}

export default Brancher;

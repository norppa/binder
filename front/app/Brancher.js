import React from 'react'
import './Brancher.css'
import { FaFileAlt, FaFolder, FaFolderOpen } from 'react-icons/fa'

const Node = ({file, select}) => {
    const { id, name, children, expanded, selected } = file
    const icon = (children ? (expanded ? <FaFolderOpen /> : <FaFolder />) : <FaFileAlt />)
    const classNames = 'name' + (selected ? ' selected' : '')

    return (
        <div className="brancher-node">
            <span className={classNames} onClick={select(id)}>
                {icon} {file.name}
            </span>
            {file.expanded ?
            <div className="brancher-folder-children">
                {file.children.map(x => <Node key={x.id} file={x} select={select}/>)}
            </div>
            : null}
        </div>
        )
}

class Brancher extends React.Component {

    select = (id) => () => {
        const selectRecursion = (node) => {
            let result = null
            if (node.selected) {
                delete node.selected
            }
            if (node.children) {
                for (let i = 0; i < node.children.length; i++) {
                    const recursionResult = selectRecursion(node.children[i])
                    result = result || recursionResult
                }
            }
            if (result && result.selected && !result.parent) {
                result.parent = node
            }
            if (node.id === id) {
                node.selected = true
                if (node.children) {
                    if (node.expanded) {
                        delete node.expanded
                    } else {
                        node.expanded = true
                    }
                }
                result = { selected: node }
            }
            return result
        }

        const tree = [...this.props.data]
        const result = selectRecursion({ id: null, name: 'root', children: tree })

        this.props.setData(tree)
        this.props.onSelect(result)
    }

    render () {

        return (
            <div className="Brancher">
                {this.props.data.map(x => <Node key={x.id} file={x} select={this.select}/>)}
            </div>
        )
    }
}

export default Brancher;

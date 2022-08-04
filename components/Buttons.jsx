function Button(props) {
    return <button onClick={props.onClick} className={`${props.className ? props.className + ' ' : ''}bg-color-primary-reverse/80 hover:bg-color-primary-reverse/70 active:bg-color-primary-reverse/90 text-white rounded`}>{props.children}</button>
}

function ButtonText(props) {
    return <button disabled={props.disabled} className={`${props.className ? props.className + ' ' : ''}whitespace-nowrap px-1 rounded ${props.disabled ? '' : 'text-color-primary hover:bg-color-primary/30 dark:hover:bg-color-primary/10 active:bg-color-active/40 dark:active:bg-color-active/5'}`} onClick={props.onClick}>{props.children}</button>
}

export {
    Button,
    ButtonText
}
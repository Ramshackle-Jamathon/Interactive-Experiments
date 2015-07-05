package main

import (
	"fmt"
	"net/http"

	"code.google.com/p/go.net/websocket"
)

func webHandler(ws *websocket.Conn) {
	var in []byte
	if err := websocket.Message.Receive(ws, &in); err != nil {
		return
	}
	fmt.Printf("Received: %s\n", string(in))
	websocket.Message.Send(ws, in)
}

func main() {
	fmt.Println("Starting websock server: ")
	http.Handle("/echo", websocket.Handler(webHandler))
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		panic("ListenAndServe: " + err.Error())
	}
}

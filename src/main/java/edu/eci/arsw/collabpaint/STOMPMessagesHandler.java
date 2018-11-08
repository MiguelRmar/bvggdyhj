/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.eci.arsw.collabpaint;

import edu.eci.arsw.collabpaint.model.Point;
import java.io.Console;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 *
 * @author 2099444
 */
@Controller
public class STOMPMessagesHandler {

    @Autowired
    SimpMessagingTemplate msgt;
    private ConcurrentHashMap<Integer,ConcurrentLinkedQueue<String>> salas=new ConcurrentHashMap<>();
    private ConcurrentHashMap<Integer,ConcurrentLinkedQueue<Point>> listapt=new ConcurrentHashMap<>();
    
    @MessageMapping("/newpoint.{room}")
    public void getPoint(@DestinationVariable int room,Point pt) throws Exception {
        System.out.println("Nuevo punto recibido en el servidor!:" + pt+" room "+room);
        if (!listapt.containsKey(room)) {
            listapt.put(room, new ConcurrentLinkedQueue<>());
        }
        listapt.get(room).add(pt);
        synchronized(msgt){
            msgt.convertAndSend("/topic/newpoint."+room, pt);
            if (listapt.get(room).size()== 4) {
                msgt.convertAndSend("/topic/newpolygon."+room, listapt.get(room));
                listapt.get(room).clear();
            }
        }
    }
    
    @MessageMapping("/colaborations.{room}")
    public void getdibujo(@DestinationVariable int room,String name) throws Exception {
        System.out.println("Nuevo colaborador recibido en la sala: "+room);
        if (!salas.containsKey(room)) {
            salas.put(room, new ConcurrentLinkedQueue<>());
        }if (!salas.get(room).contains(name)) {
                salas.get(room).add(name);
            }
        synchronized(msgt){
            msgt.convertAndSend("/topic/colaborations." + room, salas.get(room));
        }
    }
}

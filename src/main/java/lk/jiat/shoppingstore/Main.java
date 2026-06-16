package lk.jiat.shoppingstore;

import lk.jiat.shoppingstore.config.AppConfig;
import org.apache.catalina.Context;
import org.apache.catalina.LifecycleException;
import org.apache.catalina.startup.Tomcat;
import org.glassfish.jersey.servlet.ServletContainer;

import java.io.File;

public class Main {

    private static final int SERVERPORT = 8080;
    private static final String CONTEXT_PATH = "/shoppingstore";

    public static void main(String[] args) {
        try{
            Tomcat tomcat = new Tomcat();
            tomcat.setPort(SERVERPORT);
            tomcat.getConnector();

            Context context = tomcat.addWebapp(CONTEXT_PATH, new File("src/main/webapp").getAbsolutePath());
            Tomcat.addServlet(context, "JerseyServlet", new ServletContainer(new AppConfig()));
            context.addServletMappingDecoded("/api/*", "JerseyServlet");

            tomcat.start();
            System.out.println("App URL: http://localhost:" + SERVERPORT + CONTEXT_PATH);
            tomcat.getServer().await();
        }catch (LifecycleException e){
            throw new RuntimeException();
        }
    }
}

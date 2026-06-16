package lk.jiat.shoppingstore.config;

import org.glassfish.jersey.server.ResourceConfig;

public class AppConfig extends ResourceConfig {
  public AppConfig() {
    packages("lk.jiat.shoppingstore.controller");

  }
}

package lk.jiat.shoppingstore.controller.api;

import com.google.gson.JsonObject;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lk.jiat.shoppingstore.annotation.IsUser;
import lk.jiat.shoppingstore.dto.UserDTO;
import lk.jiat.shoppingstore.entity.User;
import lk.jiat.shoppingstore.service.UserService;
import lk.jiat.shoppingstore.util.AppUtil;

@Path("/users")
public class UserController {

    @Path("/check-auth")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response checkAuth(@Context HttpServletRequest request) {
        JsonObject response = new JsonObject();
        HttpSession httpSession = request.getSession(false);

        if (httpSession != null && httpSession.getAttribute("user") != null) {
            UserDTO user = (UserDTO) httpSession.getAttribute("user");
            response.addProperty("authenticated", true);
            JsonObject userData = new JsonObject();
            userData.addProperty("id", user.getId());
            userData.addProperty("firstName", user.getFirstName());
            userData.addProperty("lastName", user.getLastName());
            userData.addProperty("fullName", user.getFirstName() + " " + user.getLastName());
            userData.addProperty("email", user.getEmail());
            response.add("user", userData);
        } else {
            response.addProperty("authenticated", false);
        }

        return Response.ok().entity(response.toString()).build();
    }

    @IsUser
    @Path("/logout")
    @GET
    public Response logout(@Context HttpServletRequest request) {

        HttpSession httpSession = request.getSession(false);
        if (httpSession != null && httpSession.getAttribute("user") != null) {
            httpSession.invalidate();
            return Response.status(Response.Status.OK).build();
        } else {
            System.out.println("else");
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response createNewAccount(String jsonData) {
        UserDTO userDTO = AppUtil.GSON.fromJson(jsonData, UserDTO.class);
        String responseJson = new UserService().addNewUser(userDTO);
        return Response.ok().entity(responseJson).build();
    }


    @Path("/login")
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response userLogin(String jsonData, @Context HttpServletRequest request) {
        UserDTO userDTO = AppUtil.GSON.fromJson(jsonData, UserDTO.class);
        String responseJson = new UserService().userLogin(userDTO, request);
        return Response.ok().entity(responseJson).build();
    }
}

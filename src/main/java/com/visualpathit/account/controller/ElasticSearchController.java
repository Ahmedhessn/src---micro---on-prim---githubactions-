package com.visualpathit.account.controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.http.HttpHost;
import org.elasticsearch.action.delete.DeleteRequest;
import org.elasticsearch.action.delete.DeleteResponse;
import org.elasticsearch.action.get.GetRequest;
import org.elasticsearch.action.get.GetResponse;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.action.index.IndexResponse;
import org.elasticsearch.action.update.UpdateRequest;
import org.elasticsearch.action.update.UpdateResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestHighLevelClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import com.visualpathit.account.model.User;
import com.visualpathit.account.service.UserService;
import com.visualpathit.account.utils.ElasticsearchUtil;

@Controller
public class ElasticSearchController {

    @Autowired
    private UserService userService;

    @RequestMapping(value = "/user/elasticsearch", method = RequestMethod.GET)
    public String insert(final Model model) throws IOException {
        List<User> users = userService.getList();

        try (RestHighLevelClient client = ElasticsearchUtil.getRestHighLevelClient()) {
            for (User user : users) {
                Map<String, Object> doc = new HashMap<>();
                doc.put("name", user.getUsername());
                doc.put("DOB", user.getDateOfBirth());
                doc.put("fatherName", user.getFatherName());
                doc.put("motherName", user.getMotherName());
                doc.put("gender", user.getGender());
                doc.put("nationality", user.getNationality());
                doc.put("phoneNumber", user.getPhoneNumber());

                IndexRequest indexRequest = new IndexRequest("users", "_doc", String.valueOf(user.getId()))
                        .source(doc);

                IndexResponse response = client.index(indexRequest, RequestOptions.DEFAULT);
                String res = response.getResult().toString();
                System.out.println(res);
            }
        }

        model.addAttribute("result", "Users indexed successfully");
        return "elasticeSearchRes";
    }

    @RequestMapping(value = "/rest/users/view/{id}", method = RequestMethod.GET)
    public String view(@PathVariable final String id, final Model model) throws IOException {
        try (RestHighLevelClient client = ElasticsearchUtil.getRestHighLevelClient()) {
            GetRequest getRequest = new GetRequest("users", "_doc", id);
            GetResponse getResponse = client.get(getRequest, RequestOptions.DEFAULT);

            System.out.println(getResponse.getSourceAsString());
            model.addAttribute("res", getResponse.getSource().get("name"));
        }

        return "elasticeSearchRes";
    }

    @RequestMapping(value = "/rest/users/update/{id}", method = RequestMethod.GET)
    public String update(@PathVariable final String id, final Model model) throws IOException {
        try (RestHighLevelClient client = ElasticsearchUtil.getRestHighLevelClient()) {
            Map<String, Object> patch = new HashMap<>();
            patch.put("gender", "male");

            UpdateRequest updateRequest = new UpdateRequest("users", "_doc", id)
                    .doc(patch);

            UpdateResponse updateResponse = client.update(updateRequest, RequestOptions.DEFAULT);
            System.out.println(updateResponse.status());
            model.addAttribute("res", updateResponse.status());
        }

        return "elasticeSearchRes";
    }

    @RequestMapping(value = "/rest/users/delete/{id}", method = RequestMethod.GET)
    public String delete(@PathVariable final String id, final Model model) throws IOException {
        try (RestHighLevelClient client = ElasticsearchUtil.getRestHighLevelClient()) {
            DeleteRequest deleteRequest = new DeleteRequest("users", "_doc", id);
            DeleteResponse deleteResponse = client.delete(deleteRequest, RequestOptions.DEFAULT);

            System.out.println(deleteResponse.getResult().toString());
            model.addAttribute("res", deleteResponse.getResult().toString());
        }

        return "elasticeSearchRes";
    }
}

package com.blogpro.model.dto.response;

import com.blogpro.entity.Article;
import lombok.Data;

import java.util.List;

@Data
public class DashboardStatsResponse {
    private long totalArticles;
    private long totalComments;
    private long totalUsers;
    private long totalViews;
    private List<Article> recentArticles;
}
